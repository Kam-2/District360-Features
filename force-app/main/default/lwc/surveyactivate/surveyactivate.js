import { LightningElement, wire, track, api } from 'lwc';
import getSurveyQuestions from '@salesforce/apex/SurveyBuilderclass.getSurveyQuestion';
import submitSurveyResponses from '@salesforce/apex/SurveyBuilderclass.submitSurveyResponses';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CUSTOM_STYLES from '@salesforce/resourceUrl/Styles_survey_cmp';
import { loadStyle } from 'lightning/platformResourceLoader';
import Nddlogopic from '@salesforce/resourceUrl/NDDlogo';
import Nddlogopic_new from '@salesforce/resourceUrl/NDDlogo_new';
import { NavigationMixin } from 'lightning/navigation';
import uploadChunkedFiles from '@salesforce/apex/SurveyBuilderclass.uploadChunkedFiles';
import getSurveyName from '@salesforce/apex/SurveyBuilderclass.getSurveyBuilderDet';     
    const MAX_FILE_SIZE = 10485760;//2097152
    const CHUNK_SIZE = 3500000;

export default class Surveyactivate extends LightningElement {
    imageUrl = Nddlogopic;
    imageUrl_new = Nddlogopic_new;
    @track ratings = {}; // Store selected ratings
    @track surveyQuestions = [];
    @track Surveyname = '';
    @track Survey = [];
    @track error;
    @api recordId;
    val = 10;
    @track starvalue;
    selectedPicklistValues = [];
    selectedCheckboxValues = [];
    @track Thankyoupage = false;
    @track firstactivatepage = true;
    @track address;
    @track submitAnotherResponse = false;
    questionId = '';
    @track filesData = [];
    @track srid;
    @track radioOptions = []; // Picklist options array
    selectedOption = ''; // Holds the selected value
    
    renderedCallback() {
        // Loading external CSS File
        Promise.all([
            loadStyle(this, CUSTOM_STYLES)
        ]).then(() => {
            // console.log('OUTPUT : ','success style file');
        })
            .catch(error => {
                console.log(error.body.message);
            });
        const iframe = this.template.querySelector('iframe[data-question-id]');
        console.log('iframe' + iframe);
        if (iframe) {
            this.questionId = iframe.getAttribute('data-question-id');
            console.log('Connected Question ID:', this.questionId);
            console.log('Mapped Address:', this.address, 'to Question ID:', questionId);
            console.log('Connected this.address:', this.address);
            // Use questionId for additional logic or initialization as needed
        } else {
            console.log('Iframe not found or questionId is not available.');
        }
    }
    connectedCallback() {
        const currentUrl = window.location.href;
        // Extract the recordId from the URL
        const recordIdMatch = currentUrl.match(/recordId=([^&]*)/);
        if (recordIdMatch) {
            this.recordId = recordIdMatch[1]; // Set the recordId from the URL
        }
        console.log('this.recordId', this.recordId);
        if (this.surveyQuestions) {
            console.log('Survey Questions before mapping:', JSON.stringify(this.surveyQuestions)); // Log the original data
            //alert('connectedcallback');
            this.surveyQuestions = [...this.surveyQuestions.map(question => {
                return {
                    ...question,
                    isStar: question.Question_Type__c === 'Stars(1-5)',
                    isMultiPicklist: question.Question_Type__c === 'Multipicklist',
                    ismap: question.Question_Type__c === 'Map',
                    isdate: question.Question_Type__c === 'Date',
                    isdatetime: question.Question_Type__c === 'Date/Time',
                    isCheckbox: question.Question_Type__c === 'Multiple Select',
                    isRadio: question.Question_Type__c === 'Dropdown',
                    isSlider: question.Question_Type__c === 'Ranking',
                    isText: question.Question_Type__c === 'Text',
                    isNumber: question.Question_Type__c === 'Number',
                    isEmail: question.Question_Type__c === 'Email',
                    isFileUpload: question.Question_Type__c === 'File Upload',
                    isVisible: !question.Parent_Question__c,
                    dependentValue: question.Dependent_Option__c || null,
                    //dependentOn: question.Dependent_On__c || null,
                };
            })];
            // Set up dependency map for easier lookup
            //this.buildDependencyMap();

            // Initialize visible questions
            //this.updateVisibleQuestions();
        
            console.log('97 Survey Questions after mapping:', JSON.stringify(this.surveyQuestions)); // Log the updated data
            //console.log('ques'+question.isStar);
        }
        window.addEventListener("message", this.handleMessage.bind(this));
    }
    // added new code on 10-03-2025
    // Build a map of which questions depend on which answers
    buildDependencyMap() {
        this.dependencyMap = {};
        
        this.surveyQuestions.forEach(question => {
            if (question.dependentOn) {
                if (!this.dependencyMap[question.dependentOn]) {
                    this.dependencyMap[question.dependentOn] = {};
                }
                
                if (!this.dependencyMap[question.dependentOn][question.dependentValue]) {
                    this.dependencyMap[question.dependentOn][question.dependentValue] = [];
                }
                
                this.dependencyMap[question.dependentOn][question.dependentValue].push(question.Id);
            }
        });
        
        console.log('Dependency Map:', JSON.stringify(this.dependencyMap));
    }

    // Update which questions should be visible based on selected values
    updateVisibleQuestions() {
        // First reset all dependent questions to not visible
        this.surveyQuestions = this.surveyQuestions.map(question => {
            if (question.dependentOn) {
                return {...question, isVisible: false};
            }
            return question;
        });
        
        // Then make visible the questions that should be based on selected values
        Object.keys(this.ratings).forEach(questionId => {
            const selectedValue = this.ratings[questionId];
            
            if (this.dependencyMap[questionId] && this.dependencyMap[questionId][selectedValue]) {
                const dependentQuestionIds = this.dependencyMap[questionId][selectedValue];
                
                this.surveyQuestions = this.surveyQuestions.map(question => {
                    if (dependentQuestionIds.includes(question.Id)) {
                        return {...question, isVisible: true};
                    }
                    return question;
                });
            }
        });
        
        // Force refresh
        this.surveyQuestions = [...this.surveyQuestions];
    }

    //ended New Code on 10-03-2025
    handleMessage(message) {
        // Check if message.data and message.data.payload exist
        if (message.data && message.data.payload) {
            console.log('message', message.origin);
            console.log('yesmessage');
            this.messageFromVF = message.data.payload;
            this.latitude = this.messageFromVF.latitude;
            this.longitude = this.messageFromVF.longitude;
            this.address = this.messageFromVF.autocompleteValue;
            // this.ratings[questionId] = this.address
            console.log("Latitude:", this.latitude);
            console.log("Longitude:", this.longitude);
            console.log("Add:", this.address);
            this.ratings[this.questionId] = this.address;
        } else {
            console.error('Received invalid message data:', message);
        }
    }
    disconnectedCallback() {
        // Cleanup the event listener
        window.removeEventListener("message", this.handleMessage.bind(this));
    }
    @wire(getSurveyQuestions, { surveyId: '$recordId' })
    wiredQuestions({ error, data }) {
        if (data) {
            this.Survey = data;
            //this.Surveyname = this.Survey[0]?.Survey__r?.Name;
            //this.submitAnotherResponse = this.Survey[0]?.Survey__r?.Submit_Another_Response__c;
            console.log('this.Surveyname' + this.Surveyname);
            console.log('this.Survey' + JSON.stringify(this.Survey));
            console.log('this.submitAnotherResponse' + this.submitAnotherResponse);
            //this.surveyQuestions = data;
            this.surveyQuestions = [...data.map(question => {
                return {
                    ...question,
                    isStar: question.Question_Type__c === 'Stars(1-5)',
                    isMultiPicklist: question.Question_Type__c === 'Multipicklist',
                    ismap: question.Question_Type__c === 'Map',
                    isdate: question.Question_Type__c === 'Date',
                    isdatetime: question.Question_Type__c === 'Date/Time',
                    isRadio: question.Question_Type__c === 'Dropdown',
                    isCheckbox: question.Question_Type__c === 'Multiple Select',
                    isSlider: question.Question_Type__c === 'Ranking',
                    isText: question.Question_Type__c === 'Text',
                    isNumber: question.Question_Type__c === 'Number',
                    isRequired: question.Required__c === true,
                    isEmail: question.Question_Type__c === 'Email',
                    isFileUpload: question.Question_Type__c === 'File Upload',
                    isVisible: !question.Parent_Question__c,
                    dependentValue: question.Dependent_Option__c || null,
                    //dependentOn: question.Dependent_On__c || null,
                    /* radioOptions: question.Question_Type__c === 'Dropdown' 
                                            ? question.User_Input_Values__c?.split(',') 
                                            : [],*/
                    radioOptions: question.Question_Type__c === 'Dropdown'
                        ? question.User_Input_Values__c?.split(',').map(value => {
                            return { label: value, value: value };
                        })
                        : [],
                    //isdate:question.Question_Type__c === 'checkbox'
                    picklistOptions: question.Question_Type__c === 'Multipicklist'
                        ? question.User_Input_Values__c?.split(',').map(value => {
                            return { label: value, value: value };
                        })
                        : [],
                    checkboxOptions: question.Question_Type__c === 'Multiple Select'
                        ? question.User_Input_Values__c?.split(',')
                        : []
                };
            })];
            //this.buildDependencyMap();
            console.log('this.surveyQuestions' + JSON.stringify(this.surveyQuestions));
        } else if (error) {
            this.error = error;
            console.error('Error fetching survey questions:', error);
        }
    }
    @wire(getSurveyName, { surveyBuildId: '$recordId' })
    wiredMethodTwo({ error, data }) {
        if (data) {
            this.Survey = data;
            this.Surveyname = this.Survey[0]?.Name;
            this.submitAnotherResponse = this.Survey[0]?.Submit_Another_Response__c;
            //this.questionisrequired = this.Survey.Survey_Questions__r.filter(question => question.Required__c);
            //console.log('this.questionisrequired'+this.questionisrequired);
            console.log('this.Surveyname' + this.Surveyname);
            console.log('this.Survey' + JSON.stringify(this.Survey));
        } else if (error) {
            this.error = error;
        }
    }
    handleOptionChange(event) {
        const selectedValue = event.target.value;
        const questionId = event.target.name;  // ID of the question
        console.log(`Selected value for question ${questionId}: ${selectedValue}`);
        this.ratings[questionId] = selectedValue;
        console.log('Updated ratings:', JSON.stringify(this.ratings));
        //added new code
        /*this.surveyQuestions.forEach(question => {
            console.log('question.Dependent_Option__c'+JSON.stringify(question.Dependent_Option__c));
            //question.isVisible = false; 
            if (question.Parent_Question__c === questionId && (question.Dependent_Option__c === selectedValue.toLowerCase() || question.Dependent_Option__c === selectedValue)) {
                question.isVisible = true; // Show the child question when parent is answered
            }
            
        });*/
        // Hide all questions initially
        /*this.surveyQuestions.forEach(question => {
            question.isVisible = false;
        });*/

        // Make the parent question visible
        let parentQuestion = this.surveyQuestions.find(q => q.Id === questionId);
        if (parentQuestion) {
            parentQuestion.isVisible = true;
        }

        // Show only the dependent question that matches the selected option
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId &&
                (question.Dependent_Option__c === selectedValue.toLowerCase() || question.Dependent_Option__c === selectedValue)) {
                question.isVisible = true; // Show the dependent question
            }
             else if(question.Parent_Question__c === questionId &&
                (question.Dependent_Option__c !== selectedValue.toLowerCase() || question.Dependent_Option__c !== selectedValue))
                {
                    console.log('231 if loop');
                    question.isVisible = false;
                }
        });
        
        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        console.log('246 this.surveyQuestions'+JSON.stringify(this.surveyQuestions));
        //ended new code
    }
    // Handle radio button value change
    handleRadioChange(event) {
        const selectedValue = event.target.value;
        const questionId = event.target.name;  // ID of the question
        console.log(`Selected value for question ${questionId}: ${selectedValue}`);
        this.ratings[questionId] = selectedValue;
        console.log('Updated ratings:', JSON.stringify(this.ratings));
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    handlePicklistChange(event) {
        const selectedValues = event.detail.value;
        const questionId = event.target.name;  // ID of the question
        console.log(`Selected values for question ${questionId}: ${selectedValues}`);
        this.selectedPicklistValues = selectedValues; // Update selected valuele
        console.log('this.selectedPicklistValues' + this.selectedPicklistValues);
        this.ratings[questionId] = selectedValues;
        console.log('Updated ratings:', JSON.stringify(this.ratings));
        //added new code
        /*this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });*/
        // Hide all questions initially
        this.surveyQuestions.forEach(question => {
            question.isVisible = false;
        });

        // Make the parent question visible
        let parentQuestion = this.surveyQuestions.find(q => q.Id === questionId);
        if (parentQuestion) {
            parentQuestion.isVisible = true;
        }

        // Show only the dependent question that matches the selected option
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId &&
                (question.Dependent_Option__c === selectedValue.toLowerCase() || question.Dependent_Option__c === selectedValue)) {
                question.isVisible = true; // Show the dependent question
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    // Handle checkbox value change
    handleCheckboxChange(event) {
        console.log('handleCheckboxChange called');
        const selectedValue = event.target.value;
        console.log('327 selectedValue'+JSON.stringify(selectedValue));
        const isChecked = event.target.checked;
        const questionId = event.target.name;  // ID of the question
        if (!this.ratings[questionId]) {
            this.ratings[questionId] = [];
        }
        if (isChecked) {
            this.ratings[questionId].push(selectedValue);
        } else {
            this.ratings[questionId] = this.ratings[questionId].filter(val => val !== selectedValue);
        }
        console.log('338'+`Selected values for question ${questionId}: ${this.selectedCheckboxValues}`);
        //added new code
        /*this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });*/
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId && (question.Dependent_Option__c === selectedValue.toLowerCase() || question.Dependent_Option__c === selectedValue)) {
                // Only show/hide child questions that depend on this specific value
                question.isVisible = isChecked;

                // If we're hiding this question, also clear its selections and hide its children
                if (!isChecked && this.ratings[question.Id]) {
                    this.ratings[question.Id] = [];
                    this.hideChildQuestions(question.Id);
                }
            }
        });

        // Force reactivity update
        this.surveyQuestions = [...this.surveyQuestions];
        //ended new code
    }
    //added new code on 10-03-2025
    hideChildQuestions(parentId) {
        // Find and hide all questions that depend on the specified parent
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === parentId) {
                question.isVisible = false;

                // Clear any selections for this question
                if (this.ratings[question.Id]) {
                    this.ratings[question.Id] = [];
                }

                // Recursively hide its children
                this.hideChildQuestions(question.Id);
            }
        });
    }
    //ended new code on 10-03-2025

    handleRating(event) {
        event.preventDefault(); // Prevents page scroll
        const questionId = event.target.name;
        console.log('questionId' + questionId);
        const questionName = event.target.name;
        const ratingValue = event.target.value;
        console.log('ratingValue' + ratingValue);
        // Store the rating value in the ratings object with the question name as key
        this.ratings[questionId] = ratingValue;
        //this.updateResponses(questionName, ratingValue);
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    // used for date
    handleInputDateChange(event) {
        const questionId = event.target.name;
        const field = event.target.dataset.id;
        /*if (field === 'dob') {
            this.dob = event.target.value;
        }
        console.log('this.dob' + this.dob);*/
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    handleInputDateTimeChange(event) {
        const questionId = event.target.name;
        //this.dateTimeValue = event.target.value;
        //console.log('Selected Date and Time:', this.dateTimeValue);
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    // For slider newly added
    handleSliderChange(event) {
        const questionId = event.target.name;
        const newValue = event.target.value;
        console.log('newValue' + newValue);
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    handleTextInputChange(event) {
        const questionId = event.target.name;
        const newValue = event.target.value;
        console.log('newValue' + newValue);
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    handleInputNumberChange(event) {
        const questionId = event.target.name;
        //this.numberValue = event.target.value;
        //console.log('Entered Number:', this.numberValue);
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    handleInputEmailChange(event) {
        const questionId = event.target.name;
        //this.emailValue = event.target.value;
        //console.log('Entered Email:', this.emailValue);
        this.ratings[questionId] = event.target.value;
        //added new code
        this.surveyQuestions.forEach(question => {
            if (question.Parent_Question__c === questionId) {
                question.isVisible = true; // Show the child question when parent is answered
            }
        });

        this.surveyQuestions = [...this.surveyQuestions]; // Force reactivity update
        //ended new code
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    handleSubmit() {
        console.log('this.fileData'+this.filesData);
        const missingFields = [];
        const invalidEmails = [];
        this.surveyQuestions.forEach(question => {
            if (question.isVisible) {
                if (question.isRequired && !this.ratings[question.Id]) {
                    missingFields.push(question);
                }
                if (question.isEmail && this.ratings[question.Id] && !this.isValidEmail(this.ratings[question.Id])) {
                    invalidEmails.push(question);
                }
            }
        });
        console.log('missingFields', JSON.stringify(missingFields));
        if (missingFields.length > 0 && this.filesData.length ==0) {
            // If there are missing fields, show a toast message and stop submission
            const missingFieldNames = missingFields.map(field => field.Name).join(', ');
            this.showToast('Error', `Please complete the Required fields: ${missingFieldNames}`, 'error');
            return; // Stop submission if any required fields are missing
        }
        if (invalidEmails.length > 0) {
            const invalidEmailFields = invalidEmails.map(field => field.Name).join(', ');
            this.showToast('Error', `Please enter valid email addresses for: ${invalidEmailFields}`, 'error');
            return; // Stop submission
        }
        console.log('Ratings data:', JSON.stringify(this.ratings));
        // Structure the response data
        /*const responses = this.surveyQuestions.map(question => ({
            questionId: question.Id,
            answer: this.ratings[question.Id] || ''
        }));*/
        // Filter responses to only include visible questions
        const visibleQuestionIds = this.surveyQuestions
            .filter(question => question.isVisible)
            .map(question => question.Id);
        
        // Structure the response data - ONLY include visible questions
        const responses = this.surveyQuestions
            .filter(question => question.isVisible)
            .map(question => ({
                questionId: question.Id,
                answer: this.ratings[question.Id] || ''
            }));
        
        console.log('Submitting responses with question names:', JSON.stringify(responses));
        // Call the Apex method with the responses
         submitSurveyResponses({ responsesJson: JSON.stringify(responses), recordId: this.recordId })
            .then((result) => {
                console.log('responseResult'+JSON.stringify(result));
                this.Thankyoupage = true;
                this.surveyQuestions = false;
                this.firstactivatepage = false;
                this.showToast('Success', 'Survey submitted successfully!', 'success');
                 if (result !== "") {
                this.srid=result
                this.handleSuccess(this.srid);
                 }
                /*if (result && Array.isArray(result)) {
                    // Remove empty strings and keep only non-blank values
                    const filteredIds = result.filter(id => id !== null && id !== "");

                    if (filteredIds.length > 0) {
                        // Assign the filtered IDs to this.srid
                        this.srid = filteredIds;

                        // Pass the filtered IDs to handleSuccess
                        this.handleSuccess(this.srid);
                    }
                }*/
                // Optionally clear responses or reset the component
            })
            .catch(error => {
                console.error('Error submitting survey:', error);
                this.showToast('Error', 'Failed to submit survey. Please try again.', 'error');
            });
            
    }
    async handleSuccess() {
        console.log('record id'+ this.srid);

        for (let i = 0; i < this.filesData.length; i++) {
        const fileDetail = this.filesData[i];
        let fromIndex = 0;
        let toIndex = Math.min(fileDetail.content.length, CHUNK_SIZE);
         const chunk = fileDetail.content.substring(fromIndex, toIndex);

        uploadChunkedFiles({
            recordId: this.srid,
            fileNames: [fileDetail.name],
            fileContents: [encodeURIComponent(chunk)],
            contentVersionIds: fileDetail.contentVersionId ? [fileDetail.contentVersionId] : []
        })
            .then(result => {
                fileDetail.contentVersionId = result[0];
                fromIndex = toIndex;
                toIndex = Math.min(fileDetail.content.length, fromIndex + CHUNK_SIZE);

                if (fromIndex < toIndex) {
                    this.uploadChunkToApex(fileDetail, fromIndex, toIndex, i );
                } 
            })
            .catch(error => {
                this.showSpinner = false;
                this.showToast('Error', 'error', error.body.message);
            }).finally(() => this.showSpinner = false );
         }
    }
    // To submit another response
    handleanotherresponse() {
        console.log('activate');
        this.firstactivatepage = true;
        console.log('this.firstactivatepage' + this.firstactivatepage);
        window.location.reload();
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
    handleUploadFinished(event) {
        const files = event.target.files;
        this.filesData = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                const fileType = file.type;
                const isImage = fileType.startsWith('image/');
                const preview = reader.result; // This will be used for preview (data URL)
                // Store file details for processing and preview
                this.filesData.push({
                    name: file.name,
                    content: base64,
                    size: file.size,
                    type: fileType,
                    isImage: isImage,
                    preview: preview
                });
            };
            reader.readAsDataURL(file); // Reads the file as a data URL for preview
        }
    }
    removeReceiptImage(event) {
        //let index = event.currentTarget.dataset.id;
        //this.filesData.splice(index, 1);
        const fileIndex = event.target.dataset.index;
        if (fileIndex !== undefined) {
            this.filesData.splice(fileIndex, 1); // Remove the file from the list
            this.filesData = [...this.filesData]; // Refresh the array for rendering
        }
    }
}