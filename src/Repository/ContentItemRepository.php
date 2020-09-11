<?php

namespace App\Repository;

use App\Entity\ContentItem;
use App\Entity\Course;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method ContentItem|null find($id, $lockMode = null, $lockVersion = null)
 * @method ContentItem|null findOneBy(array $criteria, array $orderBy = null)
 * @method ContentItem[]    findAll()
 * @method ContentItem[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ContentItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContentItem::class);
    }

    public function setCourseContentInactive(Course $course)
    {
        $em = $this->getEntityManager();
        
        $query = $em->createQuery('UPDATE App\Entity\ContentItem c SET c.active=0 WHERE c.course=:course')
            ->setParameter(':course', $course);
        
        return $query->execute();            
    }

    public function getUpdatedContentItems(Course $course)
    {
        $lastUpdated = $course->getLastUpdated();

        if (!$lastUpdated) {
            return $this->createQueryBuilder('c')
                ->andWhere('c.course = :course')
                ->andWhere('c.active = 1')
                ->setParameter('course', $course)
                ->getQuery()
                ->getResult(); 
        }

        return $this->createQueryBuilder('c')
            ->andWhere('c.course = :course')
            ->andWhere('c.updated >= :updated')
            ->andWhere('c.active = 1')
            ->setParameter('course', $course)
            ->setParameter('updated', $lastUpdated)
            ->getQuery()
            ->getResult();            
    }

    /**
     * Get all content items that haven't changed since the course was last updated.
     *
     * @param Course $course
     * @return \App\Entity\ContentItem[]
     */
    public function getUnchangedContentItems(Course $course)
    {
        $lastUpdated = $course->getLastUpdated();
        if (!$lastUpdated) {
            return [];
        }

        return $this->createQueryBuilder('c')
            ->andWhere('c.course = :course')
            ->andWhere('c.updated < :updated')
            ->andWhere('c.active = 1')
            ->setParameter('course', $course)
            ->setParameter('updated', $lastUpdated)
            ->getQuery()
            ->getResult();
    }

    // /**
    //  * @return ContentItem[] Returns an array of ContentItem objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('c.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?ContentItem
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
