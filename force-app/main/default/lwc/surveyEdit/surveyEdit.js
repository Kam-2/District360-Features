import { LightningElement, track, wire, api } from 'lwc';
import getQuestionDataTypes from '@salesforce/apex/SurveyBuilderclass.getQuestionDataTypes';
import saveSurveyQuestions from '@salesforce/apex/SurveyBuilderclass.upsertAndDeleteSurveyQuestions';
import getSurveyBuilderDet from '@salesforce/apex/SurveyBuilderclass.getSurveyBuilderDet';
import { loadStyle } from 'lightning/platformResourceLoader';
import CUSTOM_STYLES from '@salesforce/resourceUrl/Styles';
import CUSTOM_STYLES2 from '@salesforce/resourceUrl/Styles_survey_cmp';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getSurveyQuestions from '@salesforce/apex/SurveyBuilderclass.getSurveyQuestion';
export default class SurveyCmp extends NavigationMixin(LightningElement) {
    @track submitAnotherResponse = false;
    @track questionDataTypes = [];
    @track dualistoption = [];
    @track Surveyname;
    @track datatypevalue;
    @track rows = [];
    @track selectedValue = ''; 
    @track radioselectedValue = [];
    @track newOption = '';
    @track isRequired = false;
    @track dualmultiOptions = [];
    @track checkboxOptions = [];
    @track checkboxSelectedValues = [];
    @track selectedValues = [];
    @track newCheckboxOption = '';
    @track isCheckboxSelected = false;
    @track newRadioOption = ' ';
    @track selectedOptions = '';
    @track isSurveyNameSelected = false;
    @track isradiobuttonSelected = false;
    @track checkboxValues = [];
    @track newCheckboxOption = '';
    @track radioOptions = [];
    @api recordId;
    @track isDepeCheckboxSelected = false;
    @track isDepeSurveyNameSelected = false;
    @track isDeperadiobuttonSelected = false;
    @track dependencyMappings = new Map();
    @track selectedParentOptions = new Map();
    newCheckboxOption = [];
    formattedOptions = [];
    sizeClass = '';
    questionCounter = 1;
    deleteButtonSizeClass = 'slds-size_1-of-7'
    renderedCallback() {
        Promise.all([
            loadStyle(this, CUSTOM_STYLES),
            loadStyle(this, CUSTOM_STYLES2)
        ]).then(() => {
        })
            .catch(error => {});
    }
    connectedCallback() {
        console.log('this.recordId' + this.recordId);
        
        //getSurveyBuilderDet({ surveyBuildId: this.recordId })
        getSurveyQuestions({surveyId : this.recordId})
            .then((result) => {
                console.log('result'+JSON.stringify(result));
                //const surveyName = result[0].Name;
                //this.Surveyname = surveyName;
                //result[0].Survey_Questions__r.forEach((question, index) => {
                result.forEach((question, index) => {
                    let checkboxSelectedValues = [];
                    let radioSelectedValue = '';
                    console.log('test');
                    if (question.Question_Type__c === 'Multipicklist') {
                        this.dualistoption = question.User_Input_Values__c.split(',').map(value => {
                            const trimmedValue = value.trim();
                            return {
                                label: trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1),
                                value: trimmedValue.toLowerCase()
                            };
                        });
                    } else if (question.Question_Type__c === 'Multiple Select') {
                        this.checkboxOptions = question.User_Input_Values__c.split(',').map(value => {
                            const trimmedValue = value.trim();
                            return {
                                label: trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1),
                                value: trimmedValue.toLowerCase()
                            };
                        });
                    } else if (question.Question_Type__c === 'Dropdown') {
                        this.radioOptions = question.User_Input_Values__c.split(',').map(value => {
                            const trimmedValue = value.trim();
                            return {
                                label: trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1),
                                value: trimmedValue.toLowerCase()
                            };
                        });
                    }
                    
                    // Determine if this is a parent question (no parent of its own)
                    const isParentQuestion = !question.Parent_Question__c;
                    console.log('isParentQuestion-->'+question.Parent_Question__c+'-->'+isParentQuestion);
                    this.rows.push({
                        recid: question.Id,
                        id: index,
                        question: question.Name,
                        order: question.Order_of_Question__c,
                        parentQuestion: question.Parent_Question__c || '',
                        isParentQuestion: isParentQuestion, // Flag to determine if it's a parent question
                        isRequired: question.Required__c,
                        questiontype: {
                            datatype: question.Question_Type__c,
                            options: this.getOptions(question.Question_Type__c),
                        },
                        dualistoption: this.dualistoption,
                        checkboxOptions: this.checkboxOptions,
                        checkboxSelectedValues: [],
                        radioSelectedValue: '',
                        selectedValues: [],
                        isCheckboxSelected: question.Question_Type__c === 'Multiple Select',
                        isSurveyNameSelected: question.Question_Type__c === 'Multipicklist',
                        isradiobuttonSelected: question.Question_Type__c === 'Dropdown'
                    });
                });
                // After loading all rows, make sure they're properly ordered
                this.reorderQuestions();
                //this.Surveyname = surveyName;
                //this.submitAnotherResponse=result[0].Submit_Another_Response__c;
            })
            .catch((error) => {
                this.error = error;
                });
    }
    @wire(getSurveyBuilderDet, { surveyBuildId: '$recordId' })
        wiredMethodTwo({ error, data }) {
            if (data) {
                this.Survey = data;
                this.Surveyname = this.Survey[0]?.Name;
                this.submitAnotherResponse=this.Survey[0]?.Submit_Another_Response__c;
                //this.questionisrequired = this.Survey.Survey_Questions__r.filter(question => question.Required__c);
                //console.log('this.questionisrequired'+this.questionisrequired);
                console.log('this.Surveyname' + this.Surveyname);
                console.log('this.Survey' + JSON.stringify(this.Survey));
            } else if (error) {
                this.error = error;
            }
        }
    getOptions(questionType) {
        if (questionType === 'Dropdown') {
            return this.radioOptions;
        } else if (questionType === 'Multiple Select') {
            return this.checkboxOptions;
        } else if (questionType === 'DualList') {
            return this.dualistoption;
        } else {
            return [];
        }
    }
    @wire(getQuestionDataTypes)
    wiredQuestionDataTypes({ error, data }) {
        if (data) {
            this.questionDataTypes = data.map(type => {
                return { label: type, value: type };
            });
        } else if (error) {}
    }
    // Survey Name 
    handleChange(event) {
        const field = event.target.dataset.id;
        this.Surveyname = event.target.value;
    }
    // Method to handle input change for a specific row for question
    handleInputChange(event) {
        const index = event.target.dataset.index;
        const value = event.target.value;
        this.rows[index].question = value;
    }
    
    // Handle parent question change
    handleParentQuestionChange(event) {
        const index = event.target.dataset.index;
        const value = event.target.value;
        this.rows[index].parentQuestion = value;
        
        // If parent question is set, this is not a parent question itself
        this.rows[index].isParentQuestion = !value;
    }
    
    // For the Datatype event
    handledataChange(event) {
        const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.rows[index].questiontype.datatype = selectedValue;
        this.rows[index].dataType = selectedValue;

        // Set boolean flags based on the selected value
        this.rows[index].isCheckboxSelected = selectedValue === 'Multiple Select';
        this.rows[index].isSurveyNameSelected = selectedValue === 'Multipicklist';
        this.rows[index].isradiobuttonSelected = selectedValue === 'Dropdown';

        // Initialize arrays if not already
        if (!Array.isArray(this.rows[index].selectedOptions)) {
            this.rows[index].selectedOptions = [];
        }

        if (!Array.isArray(this.rows[index].checkboxSelectedValues)) {
            this.rows[index].checkboxSelectedValues = [];
        }

        // Reset selections when data type changes
        this.rows[index].selectedOptions = [];
        this.rows[index].checkboxSelectedValues = [];
        this.rows[index].radioSelectedValue = '';

        // Initialize options array if not already
        if (!Array.isArray(this.rows[index].questiontype.options)) {
            this.rows[index].questiontype.options = [];
        }
    }

    // Method to reorder all questions properly
    reorderQuestions() {
        // Filter only parent questions for ordering
        const parentQuestions = this.rows.filter(row => row.isParentQuestion);
        
        // Sort parent questions by their current order
        parentQuestions.sort((a, b) => {
            const orderA = parseInt(a.order, 10) || 0;
            const orderB = parseInt(b.order, 10) || 0;
            return orderA - orderB;
        });
        
        // Reassign order numbers sequentially starting from 1
        parentQuestions.forEach((question, index) => {
            question.order = index + 1;
        });
        
        // Update the main rows array with reordered questions
        this.rows = [...this.rows];
    }

    // Method to get the next available order number
    getNextOrderNumber() {
        // Filter only parent questions
        const parentQuestions = this.rows.filter(row => row.isParentQuestion);
        
        if (parentQuestions.length === 0) {
            return 1; // Start with 1 if there are no questions
        }
        
        // Find the highest order number
        let highestOrder = 0;
        parentQuestions.forEach(row => {
            const orderNum = parseInt(row.order, 10) || 0;
            if (orderNum > highestOrder) {
                highestOrder = orderNum;
            }
        });
        
        return highestOrder + 1;
    }
    
    // Method to add a new row
    addRow() {
        // Get next available order number
        const newOrder = this.getNextOrderNumber();
        
        this.rows.push({
            id: this.rows.length + 1,
            question: '',
            order: newOrder,
            parentQuestion: '',
            isParentQuestion: true, // By default, new rows are parent questions
            isRequired: false,
            questiontype: {
                datatype: '',
                options: []
            },
            dualmultiOptions: [],
            checkboxSelectedValues: [], 
            radioSelectedValue: [],
            selectedOptions: '',
            isCheckboxSelected: false,
            isSurveyNameSelected: false,
            isradiobuttonSelected: false,
            dependentQuestions: []
        });
    }
    
    // Method to delete a specific row by index
    deleteRow(event) {
        const index = event.target.dataset.index;
        this.rows.splice(index, 1);
        
        // Reorder questions after deletion
        this.reorderQuestions();
    }
    
    handleRequiredChange(event) {
        const index = event.target.dataset.index;
        this.rows[index].isRequired = event.target.checked;
    }
    handleCheckboxChange(event) {
        const index = event.target.dataset.index;
        if (index !== undefined && this.rows[index]) {
            // Update both arrays for consistency
            this.rows[index].checkboxSelectedValues = [...event.detail.value];
            this.rows[index].selectedOptions = [...event.detail.value];
            console.log(`Updated checkbox options for row ${index}:`, {
                checkboxSelectedValues: this.rows[index].checkboxSelectedValues,
                selectedOptions: this.rows[index].selectedOptions
            });
        }
    }
    handleNewCheckboxOptionChange(event) {
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.newCheckboxOption = event.target.value;
            this.newCheckboxOptionIndex = index;
        }
    }
    addNewCheckboxOption(event) {
        const index = event.target.dataset.index;
        console.log('index', index);
        const newOption = this.newCheckboxOption;
        console.log('newOption', newOption);
        if (index !== undefined && newOption) {
            if (this.rows[index] && this.rows[index].questiontype) {
                // Add the new option to the specific row's options
                this.rows[index].questiontype.options = [
                    ...this.rows[index].questiontype.options,
                    { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '') }
                ];
                this.newCheckboxOption = ''; // Reset input
                console.log(`Row ${index} updated options:`, JSON.stringify(this.rows[index].questiontype.options));
            } else {
                console.error(`Row or questiontype undefined at index ${index}`);
            }
        }
    }
    deleteLastCheckboxOption(event) {
        const index = event.target.dataset.index;
        if (index !== undefined && this.rows[index] && this.rows[index].questiontype) {
            const options = this.rows[index].questiontype.options;
            if (options && options.length > 0) {
                this.rows[index].questiontype.options = options.slice(0, -1);
             } else {}
        } else {}
    }
    handleDualListboxChange(event) {
        const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.rows[index].selectedValues = selectedValue;
    }
    handleNewOptionChange(event) {
        this.newOption = event.target.value;
    }
    addNewOption(event) {
        const index = event.target.dataset.index;
        const newOption = this.newOption;
        if (index !== undefined && newOption) {
            if (this.rows[index] && this.rows[index].questiontype) {
                // Add the new option to the specific row's options
                this.rows[index].questiontype.options = [
                    ...this.rows[index].questiontype.options,
                    { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '') }
                ];
                this.newOption = ''; // Reset input
            } else {
                console.error(`Row or questiontype undefined at index ${index}`);
            }
        }
    }
    // Delete Last Dual Listbox Option
    deleteLastDualistOption(event) {
        const index = event.target.dataset.index;
        if (index !== undefined && this.rows[index] && this.rows[index].questiontype) {
            const options = this.rows[index].questiontype.options;
            if (options && options.length > 0) {
                // Remove the last option and update the row
                this.rows[index].questiontype.options = options.slice(0, -1);
            } else {}
        } else {}
    }
    // For the Radio Button
    handleRadioChange(event) {
        const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.rows[index].radioSelectedValue = selectedValue;
    }
    // Handle new radio option input change
    handleNewRadioOptionChange(event) {
        this.newRadioOption = event.target.value;
    }
    // Add new radio option to the radioOptions array
    addNewRadioOption(event) {
        const index = event.target.dataset.index;
        const newOption = this.newRadioOption;
        if (newOption) {
            // Add the new option to the specific row's options
            this.rows[index].questiontype.options = [
                ...this.rows[index].questiontype.options,
                { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '') }
            ];
            this.newRadioOption = ''; // Clear the input
        }
    }
    deleteLastRadioOption(event) {
        const index = event.target.dataset.index;
        // Ensure the row and questiontype exist
        if (this.rows[index] && this.rows[index].questiontype) {
            const options = this.rows[index].questiontype.options;
            // Check if options array is not empty
            if (options && options.length > 0) {
                // Remove the last option using slice to create a new array
                this.rows[index].questiontype.options = options.slice(0, -1);
            } else {}
        } else {}
    }
    
    // This method displays toast notifications
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
    // This method is just for demonstration, to log all row values
    submitData(event) {
        console.log(this.Surveyname != '');
        console.log(this.Surveyname != null);
        if (this.Surveyname != null) {
            console.log('row' + JSON.stringify(this.rows));
            const rowsData = this.rows.map(row => {
                return {
                    question: row.question,
                    isRequired: row.isRequired,
                    dataType: row.questiontype.datatype,
                    options: row.questiontype.options.map(option => option.label),
                    order: row.isParentQuestion ? row.order : null, // Only include order for parent questions
                    parentQuestion: row.isParentQuestion ? null : row.parentQuestion, // Only include parent for dependent questions
                    recid: row.recid || row.id,
                    dependentQuestions: Array.isArray(row.dependentQuestions) ? row.dependentQuestions.map(depQuestion => ({
                        question: depQuestion.question,
                        isRequired: depQuestion.isRequired,
                        dataType: depQuestion.questiontype.datatype,
                        options: depQuestion.questiontype.options ? depQuestion.questiontype.options.map(option => option.label) : [],
                        depeOption: depQuestion.depeOption || [],
                        parentRecId:depQuestion.parentRecId,
                        optionMappings: depQuestion.optionMappings
                            ? Array.from(depQuestion.optionMappings.entries()).map(([parentOption, dependentOptions]) => ({
                                parentOption,
                                dependentOptions
                            }))
                            : []
                    })) : []
                };
            });
            
            //Call Apex method to save the data
            saveSurveyQuestions({ surveyData: rowsData, surveyBuildId: this.recordId, surveyName: this.Surveyname,submitAnotherResponse: this.submitAnotherResponse })
                .then(() => {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: this.recordId,
                            objectApiName: 'Survey_Builder__c',
                            actionName: 'view',
                        },
                    });
                    // Success handling
                    this.rows = [];
                    this.surveyName = '';  // Clear the survey name
                    this.showToast('Success', 'Survey updated successfully!', 'success');
                })
                .catch(error => {
                    // Error handling
                    this.showToast('Error', 'Failed to save survey: ' + error.body.message, 'error');
                });
        }
        else {
            this.showToast('Error', 'Enter Survey Name to submit', 'error');
        }
    }
    handlebacktolist() {
        console.log('this.recordIdhandlebacktolist' + this.recordId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                objectApiName: 'Survey_Builder__c',
                recordId: this.recordId,
                actionName: 'view',
            },
        });
    }
    
    // Improved handling of order changes
    /*handleOrderChange(event) {
        const index = event.target.dataset.index;
        const newOrder = parseInt(event.target.value, 10);
        
        // Validate the new order value
        if (isNaN(newOrder) || newOrder < 1) {
            return; // Invalid order number
        }
        
        // Get current row and update its order
        const currentRow = this.rows[index];
        const oldOrder = parseInt(currentRow.order, 10) || 0;
        currentRow.order = newOrder;
        
        // Reorder all questions
        this.reorderQuestions();
    }*/
    handleOrderChange(event) {
        const index = event.target.dataset.index;
        let newOrder = parseInt(event.target.value, 10);
        if (isNaN(newOrder) || newOrder < 1 || newOrder > this.rows.length) {
            return;
        }
        let updatedRow = { ...this.rows[index], order: newOrder };
        this.rows.splice(index, 1);
        this.rows.splice(newOrder - 1, 0, updatedRow);
        this.rows = this.rows.map((row, i) => ({ ...row, order: i + 1 }));
        this.rows = [...this.rows];
    }
    addDependentQuestion(event) {
        const index = parseInt(event.target.dataset.index);
        const parentRow = this.rows[index];
        const parentRecId = parentRow.recid;
        console.log('parentRecId-->'+parentRecId);
        let optionMappings = new Map();
        let selectedValues = [];

        if (parentRow.questiontype.datatype === 'Multiple Select' || parentRow.questiontype.datatype === 'Multipicklist') {
            selectedValues = parentRow.selectedOptions || [];
        } else if (parentRow.questiontype.datatype === 'Dropdown') {
            selectedValues = parentRow.radioSelectedValue ? [parentRow.radioSelectedValue] : [];
        }

        selectedValues.forEach(selectedOption => {
            optionMappings.set(selectedOption, []); // Initialize empty array for child options
        });

        const newDepQuestion = {
            id: Date.now(),
            question: '',
            isRequired: false,
            questiontype: { datatype: '', options: [] },
            parentId: parentRow.id,
            optionMappings: optionMappings,
            depeOption: selectedValues,
            parentOptions: selectedValues,
            parentRecId: parentRecId
        };

        if (!parentRow.dependentQuestions) {
            parentRow.dependentQuestions = [];
        }

        parentRow.dependentQuestions.push(newDepQuestion);

        this.dependencyMappings.set(newDepQuestion.id, optionMappings);
        this.selectedParentOptions.set(newDepQuestion.id, selectedValues);

        this.rows = [...this.rows];

        console.log('Dependency Created:', {
            parentQuestion: parentRow.question,
            selectedValues: selectedValues,
            mappings: Array.from(optionMappings.entries())
        });
    }
    addNewDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const parentOptionIndex = parseInt(event.target.dataset.parentOptionIndex);
        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];

        if (depQuestion.newOption) {
            const newOption = {
                label: depQuestion.newOption,
                value: depQuestion.newOption.toLowerCase().replace(/\s+/g, '_')
            };

            // Add to general options list of the dependent question
            depQuestion.questiontype.options = [
                ...depQuestion.questiontype.options,
                newOption
            ];

            // Get parent option associated with this dependent question
            let parentOption = depQuestion.parentOptions[parentOptionIndex];

            // Ensure option mappings exist
            if (!depQuestion.optionMappings) {
                depQuestion.optionMappings = new Map();
            }

            // Store new dependent option under the parent option
            if (depQuestion.optionMappings.has(parentOption)) {
                depQuestion.optionMappings.get(parentOption).push(newOption.value);
            } else {
                depQuestion.optionMappings.set(parentOption, [newOption.value]);
            }

            // Convert Map to plain object for reactivity
            depQuestion.optionMappings = new Map(depQuestion.optionMappings);

            // Force re-render by updating rows
            this.rows = [...this.rows];

            console.log('Updated Dependency:', {
                parentOption,
                newOption: newOption.value,
                mappings: Array.from(depQuestion.optionMappings.entries()) // Convert Map to array for debugging
            });

            // Reset input field
            depQuestion.newOption = '';
        }
    }
    deleteDependentQuestion(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions.splice(depIndex, 1);
    }
    handleDependentQuestionChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions[depIndex].question = event.target.value;
    }
    handleDependentRequiredChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions[depIndex].isRequired = event.target.checked;
    }
    handleDependentDataChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const selectedValue = event.detail.value;
        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];
        depQuestion.questiontype.datatype = selectedValue;
        depQuestion.isPicklistType = ['Picklist', 'Multiple Select','Multipicklist','Dropdown'].includes(selectedValue);
    }
    // Dependent Question Picklist Handlers
    handleDependentPicklistChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions[depIndex].selectedValue = event.detail.value;
    }
    handleNewDependentOptionChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions[depIndex].newOption = event.target.value;
    }
    deleteLastDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const options = this.rows[mainIndex].dependentQuestions[depIndex].questiontype.options;
        if (options.length > 0) {
            this.rows[mainIndex].dependentQuestions[depIndex].questiontype.options = options.slice(0, -1);
        }
    }
    handleCheckboxChangeres(event) {
        console.log('called');
        this.submitAnotherResponse = event.target.checked;
    }
}