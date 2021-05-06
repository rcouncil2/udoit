import React from 'react'
import { Checkbox } from '@instructure/ui-checkbox';
import { View } from '@instructure/ui-view'
import { Button } from '@instructure/ui-buttons'
import { Spinner } from '@instructure/ui-spinner'
import { SimpleSelect } from '@instructure/ui-simple-select'
import Html from '../../Services/Html';


export default class HeadingStyleForm extends React.Component {
    constructor(props) {
        super(props)

        let element = Html.toElement(this.props.activeIssue.sourceHtml)

        this.tagName = Html.getTagName(element)
        this.styleTags = ["STRONG", "B", "I", "EM", "MARK", "SMALL", "DEL", "INS", "SUB", "SUP"]

        this.state = {
            codeInputValue: element.innerHTML,
            textInputValue: element.innerText,
            selectedValue: (this.tagName.startsWith('H')) ? this.tagName : '',
            removeStyling: false,
            useHtmlEditor: false,
            textInputErrors: []
        }

        this.formErrors = []

        this.handleTextInput = this.handleTextInput.bind(this)
        this.handleSelect = this.handleSelect.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        // this.handleToggle = this.handleToggle.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.activeIssue !== this.props.activeIssue) {
            const html = (this.props.activeIssue.newHtml) ? this.props.activeIssue.newHtml : this.props.activeIssue.sourceHtml
            let element = Html.toElement(html)

            this.tagName = Html.getTagName(element)
        
            this.state = {
                codeInputValue: element.innerHTML,
                textInputValue: element.innerText,
                selectedValue: (this.tagName.startsWith('H')) ? this.tagName : '',
                removeStyling: false,
                useHtmlEditor: false,
                textInputErrors: []
            }

            this.formErrors = []
        }
    }


    handleCheckbox() {
        this.setState({
            removeStyling: !this.state.removeStyling
        }, () => {
            let issue = this.props.activeIssue
            issue.newHtml = this.processHtml()
            this.props.handleActiveIssue(issue)
        })
    }

    handleTextInput(event) {
        this.setState({
            textInputValue: event.target.value
        }, () => {
            let issue = this.props.activeIssue
            issue.newHtml = this.processHtml()
            this.props.handleActiveIssue(issue)
        })
    }

    
    handleSelect = (e, { id, value }) => {
        this.formErrors = []

        this.setState({ selectedValue: value }, () => {
            let issue = this.props.activeIssue
            issue.newHtml = this.processHtml()
            this.props.handleActiveIssue(issue)
        })
    }

    handleSubmit() {
        this.formErrors = []

        if(!this.state.removeStyling) {
            this.checkSelectNotEmpty()
        }
        

        if (this.formErrors.length > 0) {
            this.setState({ textInputErrors: this.formErrors })
        } 
        
        else {
            this.setState({ textInputErrors: []})
            let issue = this.props.activeIssue
            issue.newHtml = this.processHtml()
            this.props.handleIssueSave(issue)
        }
    }

    checkSelectNotEmpty() {
        if (this.state.selectedValue === '' && !this.state.removeStyling) {
          this.formErrors.push({ text: this.props.t('form.heading.msg.select_heading'), type: 'error' })
        }
    }

    processHtml() {
        let newHeader
        const element = Html.toElement(this.props.activeIssue.sourceHtml)

        if (this.state.selectedValue) {
            newHeader = document.createElement(this.state.selectedValue)
            newHeader.innerHTML = element.innerHTML

            for (let styleTag of this.styleTags) {
                newHeader = Html.removeTag(newHeader, styleTag)
            }
        }
        else {
            newHeader = element

            if (this.state.removeStyling) {
                for (let styleTag of this.styleTags) {
                    newHeader = Html.removeTag(newHeader, styleTag)
                }
            }
        }

        return Html.toString(newHeader)
    }

    render() {
        const options = this.props.t('form.heading.heading_level_options')
        const pending = (this.props.activeIssue && (this.props.activeIssue.pending == '1'))
        const buttonLabel = (pending) ? 'form.processing' : 'form.submit'

        return (
            <View as="div" padding="x-small">
                <View as="div" margin="small 0">
                    <SimpleSelect
                    renderLabel={this.props.t('form.heading.heading_level')}
                    assistiveText={this.props.t('form.heading.assistive_text')}
                    value={this.state.selectedValue}
                    onChange={this.handleSelect}
                    messages={this.formErrors}
                    width="100%"
                    >
                        <SimpleSelect.Option
                            key="opt-empty"
                            id="opt-empty"
                            value=""
                        >
                            -- Choose --
                        </SimpleSelect.Option>
                        {options.map((opt, index) => (
                            <SimpleSelect.Option
                            key={index}
                            id={`opt-${index}`}
                            value={opt}
                            >
                            { opt }
                            </SimpleSelect.Option>
                        ))}
                    </SimpleSelect>
                </View>

                <View as="div" margin="small 0">
                    <Checkbox label={this.props.t('form.heading.remove_styling')} onChange={this.handleCheckbox} checked={this.state.removeStyling}/>
                </View>
                <View as="div" margin="small 0">
                    <Button color="primary" onClick={this.handleSubmit} interaction={(!pending) ? 'enabled' : 'disabled'}>
                        {pending && <Spinner size="x-small" renderTitle={buttonLabel} />}
                        {this.props.t(buttonLabel)}
                    </Button>
                </View>
            </View>
        );
    }

}