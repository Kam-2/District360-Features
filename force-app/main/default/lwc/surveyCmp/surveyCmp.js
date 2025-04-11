import { LightningElement, track, wire, api } from 'lwc';
import getQuestionDataTypes from '@salesforce/apex/SurveyBuilderclass.getQuestionDataTypes'; //Import Apex method
import saveSurveyQuestions from '@salesforce/apex/SurveyBuilderclass.saveSurveyQuestions'; // Import Apex method
import { loadStyle } from 'lightning/platformResourceLoader';
import CUSTOM_STYLES from '@salesforce/resourceUrl/Styles';
import CUSTOM_STYLES2 from '@salesforce/resourceUrl/Styles_survey_cmp';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class SurveyCmp extends NavigationMixin(LightningElement) {
    @track submitAnotherResponse = false;
    @track questionDataTypes = []; // To hold the question data types fetched from custom metadata
    @track Surveyname;    // to store the Surveyname
    @track rows = [];  // Trackable array to store rows of input fields
    @track radioselectedValue = '';  // to store the radiobutton value
    @track newOption = '';
    @track dualmultiOptions = [];
    @track selectedOptions = '';
    @track checkboxOptions = [];
    @track checkboxSelectedValues = [];
    @track newCheckboxOption = '';
    @track isCheckboxSelected = false;
    @track isRequired = false;
    @track isSurveyNameSelected = false; // Control dual listbox visibility
    @track isradiobuttonSelected = false; // Control dual listbox visibility
    @track checkboxValues = [];  // Track the selected checkbox values
    @track newRadioOption = '';
    @track radioOptions = [];
    @track isDisabled = true;
    @track addDepeDisabled = false;
    @track isDepeCheckboxSelected = false;
    @track isDepeSurveyNameSelected = false;
    @track isDeperadiobuttonSelected = false;
    @track depeOption = '';
    sizeClass = '';
    questionCounter = 1; 
     @track orderError = '';
        @track dependencyMappings = new Map();
    @track selectedParentOptions = new Map();
    @track parentDepenOptionMS =false;
    @track parentDepenOptionDr =false;
    @track parentDepenOptionMP =false;
    deleteButtonSizeClass = 'slds-size_1-of-7'
    renderedCallback() {
        // Loading external CSS File
        Promise.all([
            loadStyle(this, CUSTOM_STYLES),
            loadStyle(this, CUSTOM_STYLES2)
        ]).then(() => {
            // console.log('OUTPUT : ','success style file');
        })
            .catch(error => {
                console.log(error.body.message);
            });
    }
    @wire(getQuestionDataTypes)
    wiredQuestionDataTypes({ error, data }) {
        if (data) {
            // Map the data to the format required by lightning-combobox
            this.questionDataTypes = data.map(type => {
                return { label: type, value: type };
            });
        } else if (error) {
            console.error('Error fetching question data types', error);
        }
    }
    // User to select question required or not required
    handleRequiredChange(event) {
        const index = event.target.dataset.index;
        this.rows[index].isRequired = event.target.checked;
    }
    // Input text box for Survey Name 
    handleChange(event) {
        const field = event.target.dataset.id;
        // if (field === 'Surveyname') {
        this.Surveyname = event.target.value;
        //}       
    }
    // Method to handle input change for a specific row for question
    handleInputChange(event) {
        const index = event.target.dataset.index;  // Get the index of the row
        const value = event.target.value;  // Get the new value from the input field
        // Log the current state before updating
        console.log('Before Update:', JSON.stringify(this.rows));
        // Update the value of the corresponding row
        this.rows[index].question = value;
        // Log the state after updating
        console.log('After Update:', JSON.stringify(this.rows));
    }
    // For the Datatype event
    handledataChange(event) {
       /* const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.rows[index].questiontype.datatype = selectedValue; // Update the selected value for the specific row
        console.log('Updated row: ', JSON.stringify(this.rows[index]));  // Log the updated row
        this.rows[index].dataType = selectedValue;  // Update dataType (or however you store it)
        // Set boolean flags based on the selected value
        this.rows[index].isCheckboxSelected = selectedValue === 'Multiple Select';
        this.rows[index].isSurveyNameSelected = selectedValue === 'Multipicklist';
        this.rows[index].isradiobuttonSelected = selectedValue === 'Dropdown';*/
        /*const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.rows[index].questiontype.datatype = selectedValue;
        this.rows[index].dataType = selectedValue;

        // Set boolean flags based on the selected value
        this.rows[index].isCheckboxSelected = selectedValue === 'Multiple Select';
        this.rows[index].isSurveyNameSelected = selectedValue === 'Multipicklist';
        this.rows[index].isradiobuttonSelected = selectedValue === 'Dropdown';

        if (!Array.isArray(this.rows[index].selectedOptions)) {
            this.rows[index].selectedOptions = [];
        }

        if (!Array.isArray(this.rows[index].checkboxSelectedValues)) {
            this.rows[index].checkboxSelectedValues = [];
        }

        // Reset selections when data type changes
        this.rows[index].selectedOptions = [];
        this.rows[index].checkboxSelectedValues = [];
        this.rows[index].radioSelectedValue = '';*/
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
    // Method to add a new row
    addRow() {
        this.rows.push({
            id: this.rows.length + 1,
            question: '',
            isRequired: false,
            questiontype: {
                datatype: '',
                options: []
            },
            dualmultiOptions: ['new'],
            checkboxSelectedValues: [],      // Array to hold selected checkbox options
            radioSelectedValue: '',
            selectedOptions: '',
            isCheckboxSelected: false,
            isSurveyNameSelected: false,
            isradiobuttonSelected: false,
            isRequired: false,
            dependentQuestions: [], //added new on 17-02-2025
            order: this.questionCounter++
        });
        this.renumberQuestions();
        this.isDisabled = false;
    }
    //added new code 10-03-2025
    renumberQuestions() {
        this.questionCounter = 1;
        this.rows.forEach((row, index) => {
            row.order = this.questionCounter++;
        });
    }
    //ended new code 10-03-2025
    // Method to delete a specific row by index
    deleteRow(event) {
        const index = event.target.dataset.index;
        // Remove the row at the given index
        this.rows.splice(index, 1);
        this.renumberQuestions();
    }
    // Handle checkbox change (multi-select)
    handleCheckboxChange(event) {
       /* const index = event.target.dataset.index;
        console.log('128 index',index);
        if (index !== undefined && this.rows[index]) {
            // Update selected values for the specific row
            this.rows[index].selectedOptions = [...event.detail.value];
            console.log(`Updated selected options for row ${index}:`, this.rows[index].selectedOptions);
        } else {
            console.error(`Row at index ${index} is undefined.`);
        }*/
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
    // Handle New Checkbox Option Input Change
    handleNewCheckboxOptionChange(event) {
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.newCheckboxOption = event.target.value;
            this.newCheckboxOptionIndex = index;
        }
    }
    // Add new checkbox option to the checkboxOptions array
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
    // Delete Last Checkbox Option
    deleteLastCheckboxOption(event) {
        const index = event.target.dataset.index;
        if (index !== undefined && this.rows[index] && this.rows[index].questiontype) {
            const options = this.rows[index].questiontype.options;
            if (options && options.length > 0) {
                // Remove the last option and update the row
                this.rows[index].questiontype.options = options.slice(0, -1);
                console.log(`Row ${index} updated options after delete:`, JSON.stringify(this.rows[index].questiontype.options));
            } else {
                console.warn(`No options to delete for row ${index}`);
            }
        } else {
            console.error(`Row or questiontype is undefined at index ${index}`);
        }
    }
    // Handle combobox value change(Dual list)
    handleDualListboxChange(event) {
        alert('piclist');
        /*const selectedValue = event.detail.value;  // Get the selected combobox value
        this.rows[index].questiontype.options = selectedValue;*/
        const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        if (index !== undefined && this.rows[index]) {
            this.rows[index].selectedOptions = [...selectedValue];
            console.log(`Row ${index} Dual Listbox Values Updated:`, this.rows[index].selectedOptions);
        }
    }
    handleNewOptionChange(event) {
        this.newOption = event.target.value; // Update new option value
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
                console.log(`Row ${index} updated options:`, JSON.stringify(this.rows[index].questiontype.options));
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
                console.log(`Row ${index} updated options after delete:`, JSON.stringify(this.rows[index].questiontype.options));
            } else {
                console.warn(`No options to delete for row ${index}`);
            }
        } else {
            console.error(`Row or questiontype is undefined at index ${index}`);
        }
    }
    handlePicklistChange(event) {
        /*if (index !== undefined && this.rows[index]) {
            this.row[index].radioSelectedValue = event.detail.value;
            console.log('picklist');
        }*/
        const index = event.target.dataset.index;
        if (index !== undefined && this.rows[index]) {
            this.rows[index].radioSelectedValue = event.detail.value;
            console.log(`Row ${index} Dropdown Value Updated:`, this.rows[index].radioSelectedValue);
        }
    }
    handleNewRadioOptionChange(event) {
        //this.newRadioOption = event.target.value;
        //console.log('269 handleNewRadioOptionChange'+this.newRadioOption );
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.newRadioOption = event.target.value;
        } else {
            this.newRadioOption = event.target.value; // For backward compatibility
        }
    }
    addNewRadioOption() {
        if (this.newRadioOption) {
            this.row.questiontype.options = [
                ...this.row.questiontype.options,
                { label: this.newRadioOption, value: this.newRadioOption.toLowerCase().replace(/\s+/g, '_') }
            ];
            this.newRadioOption = '';
        }
    }
    deleteLastRadioOption() {
        if (this.row.questiontype.options.length > 0) {
            this.row.questiontype.options = this.row.questiontype.options.slice(0, -1);
        }
    }
    // For the Radio Button
    handleRadioChange(event) {
        //const index = event.target.dataset.index;
        /*const selectedValue = event.detail.value; // Get the selected radio button value
        if (index !== undefined && this.rows[index]) {
            this.rows[index].radioSelectedValue = selectedValue; // Update selected radio value for the specific row
        }
        console.log(`Row ${index} Radio Value Updated:`, selectedValue);*/
        const index = event.target.dataset.index;
        const selectedValue = event.detail.value;
        if (index !== undefined && this.rows[index]) {
            this.rows[index].radioSelectedValue = selectedValue;
            console.log(`Row ${index} Radio Value Updated:`, selectedValue);
        }
    }
    // Handle new radio option input change
    /*handleNewRadioOptionChange(event) {
        //this.newRadioOption = event.target.value;
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.newRadioOption = event.target.value;
        } else {
            this.newRadioOption = event.target.value; // For backward compatibility
        }
    }*/
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
            console.log(`Row ${index} radio options:`, JSON.stringify(this.rows[index].questiontype.options));
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
                // Log updated options to verify the change
                console.log(`Updated options for row ${index}:`, JSON.stringify(this.rows[index].questiontype.options));
            } else {
                console.warn(`No options to delete for row ${index}`);
            }
        } else {
            console.error(`Row or questiontype is undefined at index ${index}`);
        }
    }
    // This method is just for demonstration, to log all row values
    submitData(event) {
        console.log(this.Surveyname != '');
        console.log(this.Surveyname != null);
        if (this.Surveyname != null) {
            console.log('row' + JSON.stringify(this.rows));
            const rowsData = this.rows.map(row => ({
                question: row.question,
                isRequired: row.isRequired,
                dataType: row.dataType,
                options: row.questiontype.options.map(option => option.label),
                order : row.order,
                dependentQuestions: row.dependentQuestions.map(depQuestion => ({
                    question: depQuestion.question,
                    isRequired: depQuestion.isRequired,
                    dataType: depQuestion.questiontype.datatype,
                    options: depQuestion.questiontype.options.map(option => option.label),
                    depeOption:depQuestion.depeOption,
                     optionMappings: depQuestion.optionMappings 
                    ? Array.from(depQuestion.optionMappings.entries()).map(([parentOption, dependentOptions]) => ({
                        parentOption,
                        dependentOptions
                    }))
                    : []
                }))
            }));
            console.log('rowsData' + JSON.stringify(rowsData));
            //Call Apex method to save the data
            saveSurveyQuestions({ surveyData: rowsData, surveyName: this.Surveyname,submitAnotherResponse: this.submitAnotherResponse })
                .then((result) => {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: result,
                            objectApiName: 'Survey_Builder__c',
                            actionName: 'view',
                        },
                    });
                    // Success handling
                    this.rows = [];
                    this.surveyName = '';  // Clear the survey name
                    this.showToast('Success', 'Survey created successfully!', 'success');
                    console.log('Survey questions saved successfully');
                })
                .catch(error => {
                    // Error handling
                    console.error('Error saving survey questions:', error);
                });
        }
        else {
            this.showToast('Error', 'Enter Survey Name to submit', 'error');
        }
    }
    // Show a toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
    handlebacktolist() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Survey_Builder__c',
                actionName: 'list',
            },
        });
    }
    /*addDependentQuestion(event) {
        const index = parseInt(event.target.dataset.index);
        const parentRow = this.rows[index];

        // Initialize mapping array for this parent-dependent relationship
        let optionMappings = new Map();  // Mapping parentOption -> List of dependentOptions
        let selectedValues = [];

        // Get selected values based on question type
        if (parentRow.questiontype.datatype === 'Multiple Select' ||
            parentRow.questiontype.datatype === 'Multipicklist') {
            selectedValues = parentRow.selectedOptions || [];
        } else if (parentRow.questiontype.datatype === 'Dropdown') {
            selectedValues = parentRow.radioSelectedValue ? [parentRow.radioSelectedValue] : [];
        }

        // Create mappings for each selected option
        selectedValues.forEach(selectedOption => {
            optionMappings.set(selectedOption, []);
        });

        // Create new dependent question with mappings
        const newDepQuestion = {
            id: Date.now(),
            question: '',
            isRequired: false,
            questiontype: {
                datatype: '',
                options: []
            },
            isPicklistType: false,
            selectedValue: '',
            newOption: '',
            parentId: parentRow.id,
            optionMappings: optionMappings,  // Store mappings here
            depeOption: selectedValues,  // Store selected parent options
            parentQuestionType: parentRow.questiontype.datatype,
            parentOptions: selectedValues
        };

        // Initialize dependentQuestions array if needed
        if (!parentRow.dependentQuestions) {
            parentRow.dependentQuestions = [];
        }

        // Add the new dependent question
        parentRow.dependentQuestions.push(newDepQuestion);

        // Store the mapping in our tracking Map
        this.dependencyMappings.set(newDepQuestion.id, optionMappings);
        this.selectedParentOptions.set(newDepQuestion.id, selectedValues);

        // Force component to re-render
        this.rows = [...this.rows];

        console.log('Dependency created:', {
            parentQuestion: parentRow.question,
            selectedValues: selectedValues,
            mappings: Array.from(optionMappings.entries())  // Convert Map to array for logging
        });
    }*/
    addDependentQuestion(event) {
        const index = parseInt(event.target.dataset.index);
        const parentRow = this.rows[index];
        console.log('parentRow'+JSON.stringify(parentRow));
        // Get selected values based on question type
        let selectedValues = [];
        
        if (parentRow.questiontype.datatype === 'Multiple Select' || 
            parentRow.questiontype.datatype === 'Multipicklist') {
            // For multi-select types, use the selectedOptions array
            selectedValues = Array.isArray(parentRow.selectedOptions) ? [...parentRow.selectedOptions] : [];
        } else if (parentRow.questiontype.datatype === 'Dropdown') {
            // For dropdown/picklist, use radioSelectedValue
            selectedValues = parentRow.radioSelectedValue ? [parentRow.radioSelectedValue] : [];
        }
        
        console.log('Selected values for dependency:', selectedValues);
        
        // Only proceed if parent has selected options
        /*if (!selectedValues || selectedValues.length === 0) {
            this.showToast('Warning', 'Please select at least one option for the parent question', 'warning');
            return;
        }*/
        
        // Initialize optionMappings
        let optionMappings = new Map();
        selectedValues.forEach(selectedOption => {
            optionMappings.set(selectedOption, []);
        });
        
        // Create new dependent question
        const newDepQuestion = {
            id: Date.now(),
            question: '',
            isRequired: false,
            questiontype: {
                datatype: '',
                options: []
            },
            isPicklistType: false,
            parentId: parentRow.id,
            optionMappings: optionMappings,
            depeOption: selectedValues,
            parentOptions: selectedValues,
            selectedValue: '',
            newOption: ''
        };
        
        // Initialize dependentQuestions array if needed
        if (!parentRow.dependentQuestions) {
            parentRow.dependentQuestions = [];
        }
        
        // Add the new dependent question
        parentRow.dependentQuestions.push(newDepQuestion);
        
        // Update tracking Maps
        this.dependencyMappings.set(newDepQuestion.id, optionMappings);
        this.selectedParentOptions.set(newDepQuestion.id, selectedValues);
        
        // Force component to re-render
        this.rows = [...this.rows];
        
        console.log('Dependency created:', {
            parentQuestion: parentRow.question,
            selectedValues: selectedValues,
            mappings: Array.from(optionMappings.entries())
        });
    }
    //added new code
    /*addDependentQuestion(event) {
        const index = parseInt(event.target.dataset.index);
        const parentRow = this.rows[index];
        console.log('parentRow' + JSON.stringify(parentRow));

        // Get selected values based on question type
        let selectedValues = [];

        if (parentRow.questiontype.datatype === 'Multiple Select' ) {
                console.log('606 if loop');
            // For multi-select types, use the selectedOptions array
            selectedValues = Array.isArray(parentRow.selectedOptions) ? [...parentRow.selectedOptions] : [];
            this.parentDepenOptionMS=true;
        } else if (parentRow.questiontype.datatype === 'Dropdown') {
            console.log('606 if loop');
            // For dropdown/picklist, use radioSelectedValue
            selectedValues = parentRow.radioSelectedValue ? [parentRow.radioSelectedValue] : [];
            this.parentDepenOptionDr=true;
        }
        else if(parentRow.questiontype.datatype === 'Multipicklist')
        {
            selectedValues = Array.isArray(parentRow.selectedOptions) ? [...parentRow.selectedOptions] : [];
            this.parentDepenOptionMP=true;
        }

        console.log('Selected values for dependency:', selectedValues);

        // Only proceed if parent has selected options
        /*if (!selectedValues || selectedValues.length === 0) {
            this.showToast('Warning', 'Please select at least one option for the parent question', 'warning');
            return;
        }

        // Get all parent options for display
        const allParentOptions = this.getAllParentOptions(parentRow);

        // Initialize optionMappings
        let optionMappings = new Map();
        selectedValues.forEach(selectedOption => {
            optionMappings.set(selectedOption, []);
        });

        // Create new dependent question
        const newDepQuestion = {
            id: Date.now(),
            question: '',
            isRequired: false,
            questiontype: {
                datatype: '',
                options: []
            },
            isPicklistType: false,
            parentId: parentRow.id,
            optionMappings: optionMappings,
            depeOption: selectedValues,
            parentOptions: selectedValues,
            parentQuestion: parentRow.question,
            parentAllOptions: allParentOptions, // All options from parent question
            parentType: parentRow.questiontype.datatype, // Store parent question type
            selectedParentOption: selectedValues[0], // Default to first selected option
            selectedValue: '',
            newOption: ''
        };
        console.log('newDepQuestion'+JSON.stringify(newDepQuestion));
        // Initialize dependentQuestions array if needed
        if (!parentRow.dependentQuestions) {
            parentRow.dependentQuestions = [];
        }

        // Add the new dependent question
        parentRow.dependentQuestions.push(newDepQuestion);

        // Update tracking Maps
        this.dependencyMappings.set(newDepQuestion.id, optionMappings);
        this.selectedParentOptions.set(newDepQuestion.id, selectedValues);

        // Force component to re-render
        this.rows = [...this.rows];

        console.log('Dependency created:', {
            parentQuestion: parentRow.question,
            selectedValues: selectedValues,
            mappings: Array.from(optionMappings.entries())
        });
    }

    // Helper method to get all parent options
    getAllParentOptions(parentRow) {
        if (!parentRow || !parentRow.questiontype || !parentRow.questiontype.options) {
            return [];
        }

        return parentRow.questiontype.options.map(option => {
            return { label: option.label, value: option.value };
        });
    }

    // Handle parent option selection change for dependent question
    handleDependentParentOptionChange(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const selectedValue = event.detail.value;

        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];

        // Handle based on parent question type
        if (depQuestion.parentType === 'Multiple Select' || depQuestion.parentType === 'Multipicklist') {
            // For multi-select, value will be an array
            depQuestion.depeOption = Array.isArray(selectedValue) ? [...selectedValue] : [selectedValue];

            // Reset option mappings for deselected options
            const currentOptions = Array.from(depQuestion.optionMappings.keys());

            // Remove mappings for deselected options
            currentOptions.forEach(option => {
                if (!depQuestion.depeOption.includes(option)) {
                    depQuestion.optionMappings.delete(option);
                }
            });

            // Add new mappings for newly selected options
            depQuestion.depeOption.forEach(option => {
                if (!depQuestion.optionMappings.has(option)) {
                    depQuestion.optionMappings.set(option, []);
                }
            });
        } else {
            // For single-select (Dropdown)
            depQuestion.selectedParentOption = selectedValue;

            // Reset option mappings to only include the selected option
            depQuestion.optionMappings = new Map();
            depQuestion.optionMappings.set(selectedValue, []);
            depQuestion.depeOption = [selectedValue];
        }

        // Force component to re-render
        this.rows = [...this.rows];
    }*/
    
    //ended new code
    // Updated method for adding dependent options
    /*addNewDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const parentOptionIndex = parseInt(event.target.dataset.parentOptionIndex);
        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];
        const parentOption = depQuestion.parentOptions[parentOptionIndex];
        
        if (!depQuestion.newOption) {
            this.showToast('Warning', 'Please enter an option value', 'warning');
            return;
        }
        
        const newOption = {
            label: depQuestion.newOption,
            value: depQuestion.newOption.toLowerCase().replace(/\s+/g, '_')
        };
        
        // Add to general options list of the dependent question
        depQuestion.questiontype.options = [
            ...depQuestion.questiontype.options,
            newOption
        ];
        
        // Ensure optionMappings is properly initialized
        if (!depQuestion.optionMappings) {
            depQuestion.optionMappings = new Map();
        }
        
        // Add dependent option mapping for this parent option
        if (depQuestion.optionMappings.has(parentOption)) {
            const currentOptions = depQuestion.optionMappings.get(parentOption);
            currentOptions.push(newOption.value);
            depQuestion.optionMappings.set(parentOption, currentOptions);
        } else {
            depQuestion.optionMappings.set(parentOption, [newOption.value]);
        }
        
        // Force re-render by creating new Map instance
        depQuestion.optionMappings = new Map(depQuestion.optionMappings);
        
        // Reset input field
        depQuestion.newOption = '';
        
        // Force component to re-render
        this.rows = [...this.rows];
        
        console.log('Dependent option added:', {
            parentOption: parentOption,
            newOption: newOption.value,
            mappings: Array.from(depQuestion.optionMappings.entries())
        });
    }*/
    addNewDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const parentOptionIndex = parseInt(event.target.dataset.parentOptionIndex);
        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];
        const parentOption = depQuestion.parentOptions[parentOptionIndex];
        
        if (!depQuestion.newOption) {
            this.showToast('Warning', 'Please enter an option value', 'warning');
            return;
        }
        
        const newOption = {
            label: depQuestion.newOption,
            value: depQuestion.newOption.toLowerCase().replace(/\s+/g, '_')
        };
        
        // Add to general options list of the dependent question
        depQuestion.questiontype.options = [
            ...depQuestion.questiontype.options,
            newOption
        ];
        
        // Ensure optionMappings is properly initialized
        if (!depQuestion.optionMappings) {
            depQuestion.optionMappings = new Map();
        }
        
        // Add dependent option mapping for this parent option
        if (depQuestion.optionMappings.has(parentOption)) {
            const currentOptions = depQuestion.optionMappings.get(parentOption);
            currentOptions.push(newOption.value);
            depQuestion.optionMappings.set(parentOption, currentOptions);
        } else {
            depQuestion.optionMappings.set(parentOption, [newOption.value]);
        }
        
        // Force re-render by creating new Map instance
        depQuestion.optionMappings = new Map(depQuestion.optionMappings);
        
        // Reset input field
        depQuestion.newOption = '';
        
        // Force component to re-render
        this.rows = [...this.rows];
        
        console.log('Dependent option added:', {
            parentOption: parentOption,
            newOption: newOption.value,
            mappings: Array.from(depQuestion.optionMappings.entries())
        });
    }

    deleteDependentQuestion(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        this.rows[mainIndex].dependentQuestions.splice(depIndex, 1);
        this.rows = [...this.rows];
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
    /*deleteLastDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const options = this.rows[mainIndex].dependentQuestions[depIndex].questiontype.options;
        if (options.length > 0) {
            this.rows[mainIndex].dependentQuestions[depIndex].questiontype.options = options.slice(0, -1);
        }
    }*/
    deleteLastDependentOption(event) {
        const mainIndex = parseInt(event.target.dataset.mainIndex);
        const depIndex = parseInt(event.target.dataset.depIndex);
        const parentOptionIndex = parseInt(event.target.dataset.parentOptionIndex);
        
        const depQuestion = this.rows[mainIndex].dependentQuestions[depIndex];
        const parentOption = depQuestion.parentOptions[parentOptionIndex];
        
        // Remove from options array
        const options = depQuestion.questiontype.options;
        if (options.length > 0) {
            const lastOption = options[options.length - 1];
            
            // Remove from general options
            depQuestion.questiontype.options = options.slice(0, -1);
            
            // Remove from mappings if exists
            if (depQuestion.optionMappings && depQuestion.optionMappings.has(parentOption)) {
                const mappedOptions = depQuestion.optionMappings.get(parentOption);
                const lastIndex = mappedOptions.indexOf(lastOption.value);
                
                if (lastIndex !== -1) {
                    mappedOptions.splice(lastIndex, 1);
                    depQuestion.optionMappings.set(parentOption, mappedOptions);
                    
                    // Force re-render by creating new Map instance
                    depQuestion.optionMappings = new Map(depQuestion.optionMappings);
                }
            }
            
            // Force component to re-render
            this.rows = [...this.rows];
        }
    }
    handleCheckboxChangeres(event) {
        this.submitAnotherResponse = event.target.checked;
    }
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
}