<?php

namespace App\Controller;

use App\Entity\Course;
use App\Entity\Issue;
use App\Entity\Report;
use App\Response\ApiResponse;
use App\Services\LmsPostService;
use App\Services\PhpAllyService;
use App\Services\UtilityService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class IssuesController extends ApiController
{
    /**
     * Save change to issue HTML to LMS
     * 
     * @Route("/api/issues/{issue}/save", name="save_issue")
     * @param Issue $issue
     */
    public function saveIssue(
        Request $request, 
        LmsPostService $lmsPost, 
        PhpAllyService $phpAlly, 
        UtilityService $util, 
        Issue $issue) 
    {
        $apiResponse = new ApiResponse();
        $user = $this->getUser();

        try {
            // Check if user has access to course
            $course = $issue->getContentItem()->getCourse();
            if(!$this->userHasCourseAccess($course)) {
                throw new \Exception("You do not have permission to access this issue.");
            }

            // Get updated issue
            $newHtml = $request->getContent();
            
            // Check if new HTML is different from original HTML
            if ($issue->getHtml() === $newHtml) {
                throw new \Exception('form.error.same_html');
            }

            // Run fixed content through PhpAlly to validate it
            $report = $phpAlly->scanHtml($newHtml, [$issue->getScanRuleId()]);
            if ($issues = $report->getIssues()) {
                $apiResponse->addData('issues', $issues);
                $apiResponse->addData('failed', 1);
                throw new \Exception('form.error.fails_tests');
            }
            if ($errors = $report->getErrors()) {
                $apiResponse->addData('errors', $errors);
                $apiResponse->addData('failed', 1);
                throw new \Exception('form.error.fails_tests');
            }

            // Update issue HTML
            $issue->setNewHtml($newHtml);
            $this->getDoctrine()->getManager()->flush();

            // Save content to LMS
            $lmsPost->saveContentToLms($issue);

            // Add messages to response
            $unreadMessages = $util->getUnreadMessages();
            if (empty($unreadMessages)) {
                $apiResponse->addMessage('form.msg.success_saved', 'success');

                // Update issue status
                $issue->setHtml($newHtml);
                $issue->setStatus(Issue::$issueStatusFixed);
                $issue->setFixedBy($user);
                $issue->setFixedOn($util->getCurrentTime());
                $this->getDoctrine()->getManager()->flush();

                // Update report stats
                $report = $course->getUpdatedReport();

                $apiResponse->setData([
                    'issue' => ['status' => $issue->getStatus(), 'pending' => false],
                    'report' => $report,
                ]);
            }
            else {
                $apiResponse->addLogMessages($unreadMessages);
            }
        }
        catch(\Exception $e) {
            $apiResponse->addMessage($e->getMessage(), 'error');
        }

        return new JsonResponse($apiResponse);
    }

    /**
     * Mark issue as resolved/reviewed
     * 
     * @Route("/api/issues/{issue}/resolve", methods={"POST","GET"}, name="resolve_issue")
     * @param Issue $issue
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function markAsReviewed(Request $request, LmsPostService $lmsPost, UtilityService $util, Issue $issue)
    {
        $apiResponse = new ApiResponse();
        $user = $this->getUser();

        try {
            // Check if user has access to course
            $course = $issue->getContentItem()->getCourse();
            if (!$this->userHasCourseAccess($course)) {
                throw new \Exception("You do not have permission to access this issue.");
            }

            // Get updated issue
            $issueUpdate = \json_decode($request->getContent(), true);

            $issue->setNewHtml($issueUpdate['newHtml']);
            $this->getDoctrine()->getManager()->flush();

            // Save content to LMS
            $response = $lmsPost->saveContentToLms($issue);

            // Add messages to response
            $unreadMessages = $util->getUnreadMessages();
            if (empty($unreadMessages)) {
                // Update issue
                $issue->setHtml($issueUpdate['newHtml']);
                $issue->setStatus(($issueUpdate['status']) ? Issue::$issueStatusResolved : Issue::$issueStatusActive);
                $issue->setFixedBy($user);
                $issue->setFixedOn($util->getCurrentTime());

                // Update report stats
                $report = $course->getUpdatedReport();

                $this->getDoctrine()->getManager()->flush();

                if ($issue->getStatus() == Issue::$issueStatusResolved) {
                    $apiResponse->addMessage('form.msg.success_resolved', 'success');
                } else {
                    $apiResponse->addMessage('form.msg.success_unresolved', 'success');
                }

                $apiResponse->setData([
                    'issue' => ['status' => $issue->getStatus(), 'pending' => false],
                    'report' => $report
                ]);
            } else {
                $apiResponse->addLogMessages($unreadMessages);
            }            
        } catch (\Exception $e) {
            $apiResponse->addError($e->getMessage());
        }

        return new JsonResponse($apiResponse);
    }
}
