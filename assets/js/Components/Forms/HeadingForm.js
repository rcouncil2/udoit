import React from 'react'
import { CodeEditor } from '@instructure/ui-code-editor'
import { Checkbox } from '@instructure/ui-checkbox';
import { View } from '@instructure/ui-view'
import { Text } from '@instructure/ui-text'
import { TextInput } from '@instructure/ui-text-input'
import { Button } from '@instructure/ui-buttons'
import { Spinner } from '@instructure/ui-spinner'
import { SimpleSelect } from '@instructure/ui-simple-select'
import { CondensedButton } from '@instructure/ui-buttons'
import Html from '../../Services/Html';


export default class HeadingForm extends React.Component {
  constructor(props) {
    super(props)

    let element = Html.toElement(this.props.activeIssue.sourceHtml)

    this.tagName = Html.getTagName(element)

    this.state = {
      codeInputValue: element.innerHTML,
      textInputValue: element.innerText,
      selectedValue: (this.tagName === 'P') ? 'H2' : this.tagName,
      deleteHeader: false,
      useHtmlEditor: false,
      textInputErrors: []
    }

    this.formErrors = []

    this.handleCodeInput = this.handleCodeInput.bind(this)
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
        selectedValue: (this.tagName === 'P') ? 'H2' : this.tagName,
        deleteHeader: false,
        // useHtmlEditor: false
      }

      this.formErrors = []
    }
  }


  handleCheckbox() {
    this.setState({
      deleteHeader: !this.state.deleteHeader
    }, () => {
      let issue = this.props.activeIssue
      issue.newHtml = this.processHtml()
      this.props.handleActiveIssue(issue)
    })
  }

  handleCodeInput(value) {
    this.setState({
      codeInputValue: value
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
    this.setState({ selectedValue: value }, () => {
      let issue = this.props.activeIssue
      issue.newHtml = this.processHtml()
      this.props.handleActiveIssue(issue)
    })
  }

  handleSubmit() {
    this.formErrors = []

    // if(!this.state.deleteHeader && !this.state.useHtmlEditor) {
    //     this.checkTextNotEmpty()
    // }

    if (!this.state.deleteHeader) {
      this.checkTextNotEmpty()
    }


    if (this.formErrors.length > 0) {
      this.setState({ textInputErrors: this.formErrors })
    }

    else {
      this.setState({ textInputErrors: [] })
      let issue = this.props.activeIssue
      issue.newHtml = this.processHtml()
      this.props.handleIssueSave(issue)
    }
  }

  // handleToggle() {
  //     this.setState({
  //         useHtmlEditor: !this.state.useHtmlEditor
  //     }, () => {
  //         let issue = this.props.activeIssue
  //         issue.newHtml = this.processHtml()
  //         this.props.handleActiveIssue(issue)
  //     })
  // }

  checkTextNotEmpty() {
    const text = this.state.textInputValue.trim().toLowerCase()
    if (text === '') {
      this.formErrors.push({ text: this.props.t('form.heading.msg.text_empty'), type: 'error' })
    }
  }

  processHtml() {

    if (this.state.deleteHeader) {
      return ''
    }

    let newHeader = document.createElement(this.state.selectedValue)
    // let newHtml = (this.state.useHtmlEditor) ? this.state.codeInputValue : this.state.textInputValue
    let newHtml = this.state.textInputValue

    newHeader.innerHTML = newHtml
    newHeader = Html.removeTag(newHeader, 'strong')
    newHeader = Html.removeTag(newHeader, 'b')
    newHeader = Html.removeTag(newHeader, 'i')


    return Html.toString(newHeader)
  }

  render() {
    const options = this.props.t('form.heading.heading_level_options')
    const pending = (this.props.activeIssue && (this.props.activeIssue.pending == '1'))
    const buttonLabel = (pending) ? 'form.processing' : 'form.submit'

    return (
      <View as="div" padding="x-small">
        <View>
          <TextInput
            renderLabel={this.props.t('form.heading.text')}
            display="inline-block"
            width="100%"
            onChange={this.handleTextInput}
            value={this.state.textInputValue}
            id="textInputValue"
            messages={this.formErrors}
          />
        </View>
        <View as="div" margin="small 0">
          <SimpleSelect
            renderLabel={this.props.t('form.heading.heading_level')}
            assistiveText={this.props.t('form.heading.assistive_text')}
            value={this.state.selectedValue}
            onChange={this.handleSelect}
            width="100%"
          >
            {options.map((opt, index) => (
              <SimpleSelect.Option
                key={index}
                id={`opt-${index}`}
                value={opt}
              >
                { opt}
              </SimpleSelect.Option>
            ))}
          </SimpleSelect>
        </View>
        <View as="div">
          <Checkbox label={this.props.t('form.heading.remove_header')} onChange={this.handleCheckbox} checked={this.state.deleteHeader} />
        </View>
        <View as="div" margin="small 0">
          <Button color="primary" onClick={this.handleSubmit} interaction={(!pending) ? 'enabled' : 'disabled'}>
            {('1' == pending) && <Spinner size="x-small" renderTitle={buttonLabel} />}
            {this.props.t(buttonLabel)}
          </Button>
        </View>
      </View>
    );
  }
}