/**
* @File Name : SurveyBuilderclass.cls
* @Description :This class is to Save Survey question and Survey Responses
* @Author : 
* @Last Modified By :
* @Last Modified On : October 7, 2024
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | October 7, 2024 |   | Initial Version
**/

public without sharing class SurveyBuilderclass {
    @AuraEnabled(cacheable=true)
    public static List<String> getQuestionDataTypes() {
        // Query the custom metadata type for all question types
        List<Survey_Questions_mdt__mdt> questionTypes = [
            SELECT MasterLabel,Datatype__c FROM Survey_Questions_mdt__mdt
        ];
        // Extract the MasterLabel field (or whichever field holds the question types)
        List<String> options = new List<String>();
        for (Survey_Questions_mdt__mdt types : questionTypes) {
            options.add(types.Datatype__c); // Assuming MasterLabel holds the display values
            System.debug('options'+options);
        }
        system.debug('options'+options);
        return options;
        
    }
    
    // Method to save survey questions from LWC into custom metadata
    /*@AuraEnabled
    public static Id saveSurveyQuestions(List<Map<String, Object>> surveyData, String surveyName) {
        system.debug('surveyData: ' + surveyData);
        system.debug('surveyName: ' + surveyName);
        
        // Create a new Survey_Builder__c record
        Survey_Builder__c ObjSB = new Survey_Builder__c();
        ObjSB.Name = surveyName;
        insert ObjSB;  // Insert the survey and get its Id
        
        // List to hold new Survey_Question__c records
        List<Survey_Question__c> recordsToInsert = new List<Survey_Question__c>();
        
        // Loop through each question and datatype coming from LWC
        for (Map<String, Object> survey : surveyData) {
            System.debug('survey-->'+survey);
            if (survey.get('question') != null && survey.get('dataType') != null) {
                Survey_Question__c newRecord = new Survey_Question__c();
                
                // Set fields for the custom object
                String questionText = (String) survey.get('question');
                
                if (String.isBlank(questionText)) {
                    System.debug('Name is blank. Assigning default value.');
                    questionText = 'No Question';
                    newRecord.Name =questionText;
                } else {
                    newRecord.Name = (String) survey.get('question');  
                }// The question text
                newRecord.Question_Type__c = (String) survey.get('dataType');  // Selected data type
                newRecord.Survey__c = ObjSB.Id;  // Associate with the Survey Builder record
                Boolean isRequired = (Boolean) survey.get('isRequired');  // Assuming 'isRequired' is a boolean field in surveyData
                system.debug('isRequired'+isRequired);
                newRecord.Required__c	 =isRequired;
                // Handle the options list if it's present
                if (survey.containsKey('options')) {
                    List<Object> optionsAny = (List<Object>) survey.get('options');  // Cast to List<Object> first
                    List<String> options = new List<String>();
                    
                    // Iterate over the List<Object> and cast each item to String
                    for (Object option : optionsAny) {
                        options.add((String) option);
                    }
                    
                    // Join the options into a comma-separated string
                    newRecord.User_Input_Values__c = String.join(options, ',');
                }
                
                // Add the new record to the list
                recordsToInsert.add(newRecord);
            }
        }
        
        // Insert the custom object records if the list is not empty
        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;  // Perform bulk DML operation
        }
        return ObjSB.Id;
    }*/
    
    //added new code
   @AuraEnabled
    public static Id saveSurveyQuestions(List<Map<String, Object>> surveyData, String surveyName,Boolean submitAnotherResponse) {
        System.debug('surveyData: ' + surveyData);
        System.debug('surveyName: ' + surveyName);
        System.debug('submitAnotherResponse: ' + submitAnotherResponse);
        Map<String, Survey_Question__c> questionMap = new Map<String, Survey_Question__c>();
        
        // Create a new Survey_Builder__c record
        Survey_Builder__c ObjSB = new Survey_Builder__c();
        ObjSB.Name = surveyName;
        ObjSB.Submit_Another_Response__c=submitAnotherResponse;
        insert ObjSB;  // Insert the survey and get its Id
        
        // List to hold new Survey_Question__c records
        List<Survey_Question__c> recordsToInsert = new List<Survey_Question__c>();
        
        // Loop through each question from LWC
        for (Map<String, Object> survey : surveyData) {
            System.debug('survey --> ' + survey);
            if (survey.get('question') != null && survey.get('dataType') != null) {
                Survey_Question__c newRecord = new Survey_Question__c();
                
                // Set main question fields
                String questionText = (String) survey.get('question');
                if (String.isBlank(questionText)) {
                    System.debug('Name is blank. Assigning default value.');
                    questionText = 'No Question';
                }
                newRecord.Name = questionText;
                newRecord.Question_Type__c = (String) survey.get('dataType');
                newRecord.Survey__c = ObjSB.Id;
                newRecord.Required__c = (Boolean) survey.get('isRequired');
                newRecord.Order_of_Question__c=(Decimal) survey.get('order');
                // Handle options for the main question, if provided
                if (survey.containsKey('options')) {
                    List<Object> optionsAny = (List<Object>) survey.get('options');
                    List<String> options = new List<String>();
                    for (Object option : optionsAny) {
                        options.add((String) option);
                    }
                    newRecord.User_Input_Values__c = String.join(options, ',');
                }
                
                // Add the main question record to the list first so that its Id can be used as a parent reference
                recordsToInsert.add(newRecord);
                questionMap.put(newRecord.Name, newRecord);
                
            }
        }
        // Insert all the question records
        Map<String, Id> tempIdMap1 = new Map<String, Id>();
        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;
        }
        List<Survey_Question__c> dependentQuestions = new List<Survey_Question__c>();
        for (Map<String, Object> survey : surveyData) 
        {
            System.debug('questionMap'+questionMap);
            if (survey.containsKey('dependentQuestions')) 
            {
                List<Object> dependentQuestionsAny = (List<Object>) survey.get('dependentQuestions');
				for (Object depQuestionObj : dependentQuestionsAny) 
                {
                    Map<Object, Object> tempMap = (Map<Object, Object>) depQuestionObj;
                        Map<String, Object> dependentQuestion = new Map<String, Object>();
                        for (Object key : tempMap.keySet()) {
                            dependentQuestion.put(String.valueOf(key), tempMap.get(key));
                        }
                        
                        // Create a dependent question record if required fields are present
                        if (dependentQuestion.get('question') != null && dependentQuestion.get('dataType') != null) {
                            Survey_Question__c dependentRecord = new Survey_Question__c();
                            dependentRecord.Name = (String) dependentQuestion.get('question');
                            dependentRecord.Question_Type__c = (String) dependentQuestion.get('dataType');
                            dependentRecord.Survey__c = ObjSB.Id;
                            dependentRecord.Required__c = (Boolean) dependentQuestion.get('isRequired');
                            System.debug('parentQuestion'+(String) dependentQuestion.get('question'));
                            Survey_Question__c parentQuestion = questionMap.get((String) survey.get('question'));
                            system.debug('parentQuestion'+parentQuestion);
                            dependentRecord.Parent_Question__c =  parentQuestion.Id;
                            dependentRecord.Order_of_Question__c= parentQuestion.Order_of_Question__c;
                            System.debug('dependentRecord.Parent_Question__c'+dependentRecord.Parent_Question__c);
                            // Handle options for the dependent question
                            if (dependentQuestion.containsKey('options')) {
                                List<Object> depOptionsAny = (List<Object>) dependentQuestion.get('options');
                                List<String> depOptions = new List<String>();
                                for (Object depOption : depOptionsAny) {
                                    depOptions.add((String) depOption);
                                }
                                dependentRecord.User_Input_Values__c = String.join(depOptions, ',');
                            }
                            if(dependentQuestion.containsKey('depeOption'))
                            {
                                List<Object> depOptionsAny = (List<Object>) dependentQuestion.get('depeOption');
                                List<String> depeOptions = new List<String>();
                                for (Object depOption : depOptionsAny) {
                                    depeOptions.add((String) depOption);
                                }
                                dependentRecord.Dependent_Option__c = String.join(depeOptions, ','); 
                            }
                            dependentQuestions.add(dependentRecord);
                        }
                }
            }
        }
        System.debug('dependentQuestions'+dependentQuestions);
       if (!dependentQuestions.isEmpty()) {
            insert dependentQuestions;
        }
        return ObjSB.Id;
    }
    //ended new code
    
    @AuraEnabled
    public static void upsertAndDeleteSurveyQuestions(List<Map<String, Object>> surveyData, String surveyBuildId, String surveyName,Boolean submitAnotherResponse) {
        System.debug('surveyData: ' + surveyData);
        System.debug('surveyBuildId: ' + surveyBuildId);
        System.debug('surveyName: ' + surveyName);
        System.debug('submitAnotherResponse: ' + submitAnotherResponse);
        //string oldSurveyName =  [SELECT Id,Name from Survey_Builder__c where Id =:surveyBuildId].Name;
        Survey_Builder__c oldSurveyName =  [SELECT Id,Name,Submit_Another_Response__c from Survey_Builder__c where Id =:surveyBuildId];
        System.debug('oldSurveyName: ' + oldSurveyName);
        System.debug(oldSurveyName.Name != surveyName);
        Map<String, Survey_Question__c> questionMap = new Map<String, Survey_Question__c>();
        Survey_Builder__c ObjSB = new Survey_Builder__c();
        if((oldSurveyName.Name != surveyName) || (oldSurveyName.Submit_Another_Response__c != submitAnotherResponse))
        {
            if(oldSurveyName.Name != surveyName)
            {
                ObjSB.Id = surveyBuildId;
                ObjSB.Name = surveyName;
            }
            if(oldSurveyName.Submit_Another_Response__c != submitAnotherResponse)
            {	
                ObjSB.Id = surveyBuildId;
                ObjSB.Submit_Another_Response__c=submitAnotherResponse;
            }
            update ObjSB;
        }
        // Retrieve existing Survey_Questions__c records related to the Survey_Builder__c
        List<Survey_Question__c> existingSurveyQuestions = [
            SELECT Id, Name, Question_Type__c, User_Input_Values__c ,Required__c,Order_of_Question__c,Parent_Question__c
            FROM Survey_Question__c 
            WHERE Survey__c = :surveyBuildId
        ];
        System.debug('Existing Survey Questions: ' + existingSurveyQuestions);
        
        // Convert surveyData into a map for easier lookup by recid
        Map<String, Map<String, Object>> surveyDataMap = new Map<String, Map<String, Object>>();
        for (Map<String, Object> entry : surveyData) {
            System.debug('dependentQuestions'+entry.get('dependentQuestions'));
            if (entry.containsKey('recid')) {
                
                String recid = String.valueOf(entry.get('recid')); 
                surveyDataMap.put(recid, entry);
            }
        }
        //
        system.debug('surveyDataMap'+surveyDataMap);
        
        // Lists for records to insert, update, or delete
        List<Survey_Question__c> questionsToInsert = new List<Survey_Question__c>();
        List<Survey_Question__c> questionsToUpdate = new List<Survey_Question__c>();
        List<Survey_Question__c> questionsToDelete = new List<Survey_Question__c>();
        
        // Process existing records: update if found in surveyDataMap, else mark for deletion
        for (Survey_Question__c question : existingSurveyQuestions) {
            if (surveyDataMap.containsKey(question.Id)) {
                // Update existing record with data from surveyData
                Map<String, Object> data = surveyDataMap.get(question.Id);
                
                String questionText = (String) data.get('question');
                
                if (String.isBlank(questionText)) {
                    System.debug('Name is blank. Assigning default value.');
                    questionText = 'No Question';
                    question.Name =questionText;
                } else {
                    question.Name = (String)data.get('question');
                }
                question.Question_Type__c = (String)data.get('dataType');
                Object isRequiredValue = data.get('isRequired');
                Boolean isRequired;
                
                if (isRequiredValue instanceof Boolean) {
                    // If the value is already Boolean
                    isRequired = (Boolean) isRequiredValue;
                } else if (isRequiredValue instanceof String) {
                    // Convert "true"/"false" String to Boolean
                    isRequired = Boolean.valueOf((String) isRequiredValue);
                } else {
                    // Default to false if the value is null or of an unexpected type
                    isRequired = false;
                }
                /*if(data.get('parentQuestion') != null)
                {
                    
                }
                else
                {
                    question.Order_of_Question__c=(Decimal) Data.get('order');
                }*/
                // Debug the value to ensure it’s correct
                System.debug('isRequired: ' + isRequired);
                question.Order_of_Question__c=(Decimal) Data.get('order');
                // Assign to the question field
                question.Required__c = isRequired;
                //  question.User_Input_Values__c = (String)data.get('options');
                // Handle the options list if it's present
                if (data.containsKey('options')) {
                    List<Object> optionsAny = (List<Object>) data.get('options');  // Cast to List<Object> first
                    List<String> options = new List<String>();
                    
                    // Iterate over the List<Object> and cast each item to String
                    for (Object option : optionsAny) {
                        options.add((String) option);
                    }
                    system.debug('options'+options);
                    // Join the options into a comma-separated string
                    question.User_Input_Values__c = String.join(options, ',');
                }
                
                questionsToUpdate.add(question);
                questionMap.put(question.Name, question);
                // Remove from map to identify records that need to be inserted
                surveyDataMap.remove(question.Id);
            } else {
                // If not in surveyData, mark for deletion
                questionsToDelete.add(question);
            }
        }
        
        system.debug('surveyDataMap'+surveyDataMap);
        
        // Remaining entries in surveyDataMap are new records to insert
        for (Map<String, Object> data : surveyDataMap.values()) {
            System.debug('surveyDataMap depedent-->'+data);
            Survey_Question__c newQuestion = new Survey_Question__c();
            newQuestion.Survey__c  = surveyBuildId;
            newQuestion.Name = (String)data.get('question');
            newQuestion.Question_Type__c = (String)data.get('dataType');
            //newQuestion.User_Input_Values__c = (String)data.get('options');
            Boolean isRequired = (Boolean) data.get('isRequired');  // Assuming 'isRequired' is a boolean field in surveyData
            system.debug('isRequired'+isRequired);
            newQuestion.Required__c =isRequired;
            newQuestion.Order_of_Question__c=(Decimal) data.get('order');
            if (data.containsKey('options')) {
                List<Object> optionsAny = (List<Object>) data.get('options');  // Cast to List<Object> first
                List<String> options = new List<String>();
                
                // Iterate over the List<Object> and cast each item to String
                for (Object option : optionsAny) {
                    options.add((String) option);
                }
                
                // Join the options into a comma-separated string
                newQuestion.User_Input_Values__c = String.join(options, ',');
            }
            
            questionsToInsert.add(newQuestion);
            questionMap.put(newQuestion.Name, newQuestion);
        }
        // Perform DML operations
        if (!questionsToInsert.isEmpty()) {
            insert questionsToInsert;
        }
        if (!questionsToUpdate.isEmpty()) {
            update questionsToUpdate;
        }
        if (!questionsToDelete.isEmpty()) {
            delete questionsToDelete;
        }
        
        System.debug('Inserted Survey Questions: ' + questionsToInsert);
        System.debug('Updated Survey Questions: ' + questionsToUpdate);
        System.debug('Deleted Survey Questions: ' + questionsToDelete);
        List<Survey_Question__c> dependentQuestions = new List<Survey_Question__c>();
        for (Map<String, Object> survey : surveyData) 
        {
            System.debug('questionMap'+questionMap);
            if (survey.containsKey('dependentQuestions')) 
            {
                List<Object> dependentQuestionsAny = (List<Object>) survey.get('dependentQuestions');
				for (Object depQuestionObj : dependentQuestionsAny) 
                {
                    Map<Object, Object> tempMap = (Map<Object, Object>) depQuestionObj;
                        Map<String, Object> dependentQuestion = new Map<String, Object>();
                        for (Object key : tempMap.keySet()) {
                            dependentQuestion.put(String.valueOf(key), tempMap.get(key));
                        }
                        
                        // Create a dependent question record if required fields are present
                        if (dependentQuestion.get('question') != null && dependentQuestion.get('dataType') != null) {
                            Survey_Question__c dependentRecord = new Survey_Question__c();
                            dependentRecord.Name = (String) dependentQuestion.get('question');
                            dependentRecord.Question_Type__c = (String) dependentQuestion.get('dataType');
                            dependentRecord.Survey__c = surveyBuildId;
                            dependentRecord.Required__c = (Boolean) dependentQuestion.get('isRequired');
                            System.debug('parentQuestion'+(String) dependentQuestion.get('question'));
                            Survey_Question__c parentQuestion = questionMap.get((String) survey.get('question'));
                            system.debug('parentQuestion'+parentQuestion);
                            dependentRecord.Parent_Question__c =  parentQuestion.Id;
                            dependentRecord.Order_of_Question__c= parentQuestion.Order_of_Question__c;
                            System.debug('dependentRecord.Parent_Question__c'+dependentRecord.Parent_Question__c);
                            // Handle options for the dependent question
                            if (dependentQuestion.containsKey('options')) {
                                List<Object> depOptionsAny = (List<Object>) dependentQuestion.get('options');
                                List<String> depOptions = new List<String>();
                                for (Object depOption : depOptionsAny) {
                                    depOptions.add((String) depOption);
                                }
                                dependentRecord.User_Input_Values__c = String.join(depOptions, ',');
                            }
                            if(dependentQuestion.containsKey('depeOption'))
                            {
                                List<Object> depOptionsAny = (List<Object>) dependentQuestion.get('depeOption');
                                List<String> depeOptions = new List<String>();
                                for (Object depOption : depOptionsAny) {
                                    depeOptions.add((String) depOption);
                                }
                                dependentRecord.Dependent_Option__c = String.join(depeOptions, ','); 
                            }
                            
                            dependentQuestions.add(dependentRecord);
                        }
                }
            }
        }
        System.debug('dependentQuestions'+dependentQuestions);
       if (!dependentQuestions.isEmpty()) {
            insert dependentQuestions;
        }
        List<Survey_Question__c> updateorder=new List<Survey_Question__c>();
        if(!questionsToInsert.isEmpty())
            updateorder.addAll(questionsToInsert);
        if(!questionsToUpdate.isEmpty())
            updateorder.addAll(questionsToUpdate);
        List<Survey_Question__c> updateorderList=new List<Survey_Question__c>();
        for(Survey_Question__c ss: [select id,Parent_Question__c,Order_of_Question__c,Parent_Question__r.Order_of_Question__c,Parent_Question__r.Id
                                    from Survey_Question__c where Parent_Question__r.Id IN :updateorder])
                                    {
                                       Survey_Question__c s= new Survey_Question__c();
                                        s.id=ss.id;
                                        s.Order_of_Question__c=ss.Parent_Question__r.Order_of_Question__c;
                                        updateorderList.add(s);
                                    }
                                    update updateorderList;
    }
    
    
    
    @AuraEnabled(cacheable=true)
    public static List<Survey_Question__c> getSurveyQuestion(Id surveyId) {
        system.debug('surveyId'+surveyId);
        // Query Survey Builder and related Survey Questions
        List<Survey_Builder__c> surveyBuilders = [SELECT Id, Name, Submit_Another_Response__c,
                                                  (SELECT Id, Name, Question_Type__c, User_Input_Values__c, Required__c,
                                                   Order_of_Question__c, Parent_Question__c, Dependent_Option__c 
                                                   FROM Survey_Questions__r
                                                   ORDER BY Parent_Question__c NULLS FIRST, Order_of_Question__c ASC)
                                                  FROM Survey_Builder__c 
                                                  WHERE Id = :surveyId];
        List<Survey_Question__c> sqId = new List<Survey_Question__c>();
        // Iterate through each Survey_Builder__c to log the hierarchy
        for (Survey_Builder__c sb : surveyBuilders) {
            system.debug('Survey Builder: ' + sb.Name);
            
            if (sb.Survey_Questions__r != null && !sb.Survey_Questions__r.isEmpty()) {
                Map<Id, List<Survey_Question__c>> childQuestionsMap = new Map<Id, List<Survey_Question__c>>();
                List<Survey_Question__c> orderedQuestions = new List<Survey_Question__c>();
                
                // Categorize questions into Parent and Child
                for (Survey_Question__c sq : sb.Survey_Questions__r) {
                    if (sq.Parent_Question__c == null) {
                        orderedQuestions.add(sq); // Parent Question
                    } else {
                        if (!childQuestionsMap.containsKey(sq.Parent_Question__c)) {
                            childQuestionsMap.put(sq.Parent_Question__c, new List<Survey_Question__c>());
                        }
                        childQuestionsMap.get(sq.Parent_Question__c).add(sq); // Child Question
                    }
                }
                
                // Log Parent and Child Questions Sequentially
                for (Survey_Question__c parentQ : orderedQuestions) {
                    system.debug('Parent Question: ' + parentQ.Name + ' | Type: ' + parentQ.Question_Type__c);
                    sqId.add(parentQ);
                    // Log Child Questions if any exist for the Parent
                    if (childQuestionsMap.containsKey(parentQ.Id)) {
                        for (Survey_Question__c childQ : childQuestionsMap.get(parentQ.Id)) {
                            sqId.add(childQ);
                            system.debug('  └── Child Question: ' + childQ.Name + ' | Type: ' + childQ.Question_Type__c);
                        }
                    }
                }
            } else {
                system.debug('No questions found for this Survey Builder.');
            }
        }
        System.debug('sqId'+sqId);
        System.debug('surveyBuilders'+surveyBuilders);
        List<Survey_Question__c> sQ=[SELECT Id, Name, Question_Type__c, Survey__r.Name, User_Input_Values__c, Required__c, 
                                     Survey__r.Submit_Another_Response__c,Parent_Question__c,Dependent_Option__c,Survey__c FROM Survey_Question__c WHERE Survey__c = :surveyId 
                                     ORDER BY  Order_of_Question__c DESC];//Parent_Question__c NULLS FIRST,
        
        for(Survey_Question__c s: sqId)
        {
            System.debug('Survey'+ s);
        }
        System.debug('Survey'+ sqId);
        //return [SELECT Id, Name,Question_Type__c,Survey__r.name,User_Input_Values__c,Required__c,Survey__r.Submit_Another_Response__c FROM Survey_Question__c WHERE Survey__c = :surveyId];
    	return sqId;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Survey_Builder__c> getSurveyBuilderDet(Id surveyBuildId) {
        
        return [SELECT Id,Name,Submit_Another_Response__c,(select Id,Name, Question_Type__c,User_Input_Values__c,Required__c,
                                                           Order_of_Question__c,Parent_Question__c,Dependent_Option__c from Survey_Questions__r
                                                           ORDER BY  Order_of_Question__c ASC) from Survey_Builder__c where Id =:surveyBuildId];
        //Parent_Question__c NULLS FIRST,
        //return surveyBuilders;
    }
    @AuraEnabled
    public static string submitSurveyResponses(String responsesJson,string recordId) {
        System.debug('recordId'+recordId);
        System.debug('responsesJson'+responsesJson);
        // First, deserialize to List<Object> to avoid casting errors
        List<Object> responseObjects = (List<Object>) JSON.deserializeUntyped(responsesJson);
        
        List<Survey_Responses__c> surveyResponseRecords = new List<Survey_Responses__c>();
        String newSubmissionId = generateNewSubmissionId(recordId);
        
        
        // Iterate over each item and cast it to a Map<String, Object>
        for (Object obj : responseObjects) {
            Map<String, Object> response = (Map<String, Object>) obj;
            
            Survey_Responses__c surveyResponse = new Survey_Responses__c();
            surveyResponse.Survey_Question__c = (String) response.get('questionId');
            surveyResponse.Survey__c=recordId;
            surveyResponse.Submission_ID__c=newSubmissionId;
            // Handle different types of answers (string or list)
            Object answer = response.get('answer');
            if (answer instanceof String) {
                surveyResponse.Response_Value__c = (String) answer;
                
                
            } else if (answer instanceof List<Object>) {
                // Convert List<Object> to List<String>
                List<Object> answerList = (List<Object>) answer;
                List<String> stringAnswers = new List<String>();
                for (Object item : answerList) {
                    stringAnswers.add((String) item);
                }
                // Join the List<String> into a comma-separated string
                surveyResponse.Response_Value__c = String.join(stringAnswers, ', ');
            }
            else if (answer instanceof Date) {
                system.debug('date');
                surveyResponse.Response_Value__c = ((Date) answer).format();
            }
            else if (answer instanceof Datetime) {
                system.debug('datetime');
                surveyResponse.Response_Value__c = ((Datetime) answer).format('yyyy-MM-dd HH:mm:ss');
            }
            
            surveyResponseRecords.add(surveyResponse);
        }
        
        // Insert the list of Survey_Response__c records
        if (!surveyResponseRecords.isEmpty()) {
            insert surveyResponseRecords;
            system.debug('surveyResponseRecords'+surveyResponseRecords);
        }
        //List<String> retrunval =new List<String>();
        string retrunval;
        for(Survey_Responses__c sr :[select id, name, Survey_Question__c,Survey_Question__r.Question_Type__c from Survey_Responses__c where id in :surveyResponseRecords and Survey_Question__r.Question_Type__c =: 'File Upload'])
        {
            System.debug('sr'+sr);
            if(sr.Survey_Question__r.Question_Type__c == 'File Upload')
            {
                 System.debug('528 sr'+sr.Survey_Question__r.Question_Type__c);
                retrunval = sr.id;
                //retrunval.add(sr.Id);
            }
            if(sr.Survey_Question__r.Question_Type__c != 'File Upload') 
                retrunval = '';
                //retrunval.add('');
        }
        system.debug('retrunval'+retrunval);
        return retrunval;
    }
    
    private static String generateNewSubmissionId(string recordId) {
        
        
        List<Survey_Builder__c> surveyRecords = [ 
            SELECT Name
            FROM Survey_Builder__c
            WHERE Id = :recordId
        ];
        String surveyNames;
        if (!surveyRecords.isEmpty()) {
            surveyNames = surveyRecords[0].Name;
            System.debug('Survey Names: ' + surveyNames);
        } else {
            System.debug('No survey record found with the given Id: ' + recordId);
        }
        
        // Query the latest Submission ID from Survey_Responses__c
        list<Survey_Responses__c> lastResponse = [
            SELECT Submission_ID__c ,Survey__c,Survey__r.Name
            FROM Survey_Responses__c 
            WHERE Submission_ID__c != NULL and Survey__c=:recordId
            ORDER BY CreatedDate DESC 
            LIMIT 1
        ];
        
        system.debug('lastResponse'+lastResponse);   
        String surveyName = lastResponse.isEmpty() ? null : lastResponse[0].Survey__r.Name;
        System.debug('Survey Name: ' + surveyName);
        String lastSubmissionId;
        if(!lastResponse.isempty()){
            lastSubmissionId = lastResponse[0] != null ? lastResponse[0].Submission_ID__c : null;
        }
        Integer nextNumber = 1;
        system.debug('lastSubmissionId'+lastSubmissionId);
        if (lastSubmissionId != null) {
            // Extract the numeric part of the last Submission ID
            String lastNumberStr = lastSubmissionId.substring(lastSubmissionId.lastIndexOf('-') + 1);
            
            nextNumber = Integer.valueOf(lastNumberStr) + 1;
        }
        
        // Manually pad the number with leading zeros to ensure it’s 4 digits
        String nextNumberStr = String.valueOf(nextNumber);
        while (nextNumberStr.length() < 4) {
            nextNumberStr = '0' + nextNumberStr;
        }
        
        return surveyNames +'-'+ nextNumberStr;
    }
    
    //file upload start code
	
	@AuraEnabled
    public static List<Id> uploadChunkedFiles(Id recordId, List<String> fileNames, List<String> fileContents, List<String> contentVersionIds) {
        System.debug('uploadChunkedFiles');
        List<Id> contentVersionIdList = new List<Id>();
        try {
            for (Integer i = 0; i < fileNames.size(); i++) {
                String fileName = fileNames[i];
                String fileContent = fileContents[i];
                String contentVersionId = (contentVersionIds != null && contentVersionIds.size() > i) ? contentVersionIds[i] : null;

                fileContent = EncodingUtil.urlDecode(fileContent, 'UTF-8');

                if (String.isBlank(contentVersionId)) {
                    // Create a new ContentVersion record
                    ContentVersion cvObj = new ContentVersion();
                    cvObj.Title = fileName;
                    cvObj.VersionData = EncodingUtil.base64Decode(fileContent);
                    cvObj.PathOnClient = '/' + fileName;
                    cvObj.IsMajorVersion = false;
                    insert cvObj;

                    Id contentDocId = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cvObj.Id].ContentDocumentId;

                    // Link the content to the record
                    ContentDocumentLink cl = new ContentDocumentLink();
                    cl.ContentDocumentId = contentDocId;
                    cl.LinkedEntityId = recordId;
                    cl.ShareType = 'V';
                    cl.Visibility = 'AllUsers';
                    insert cl;

                    contentVersionId = cvObj.Id;
                } else {
                    // Update existing ContentVersion
                    ContentVersion cvObj = [SELECT Id, VersionData, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersionId];
                    String existingFileContent = EncodingUtil.base64Encode(cvObj.VersionData);
                    cvObj.VersionData = EncodingUtil.base64Decode(existingFileContent + fileContent);
                    update cvObj;
                }
                contentVersionIdList.add(Id.valueOf(contentVersionId));
            }
            List<Survey_Responses__c> updateSurvey = new List<Survey_Responses__c>();
           	for(Survey_Responses__c s:[select id,Is_Attachment__c from Survey_Responses__c where id=:recordId])
            {
                Survey_Responses__c ss= new Survey_Responses__c();
                ss.id=s.id;
                ss.Is_Attachment__c=true;
                updateSurvey.add(ss);
            }
            update updateSurvey;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
        return contentVersionIdList;
    }
	//file upload end code
    
}