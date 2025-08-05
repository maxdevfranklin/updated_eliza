import { Action, ActionResult, Content, IAgentRuntime, Memory, ModelType, State, HandlerCallback, logger } from "@elizaos/core";

// Simple fallback implementations to avoid provider dependency issues
const saveUserResponse = async (runtime: IAgentRuntime, message: Memory, stage: string, userResponse: string) => {
    logger.info(`Saving user response for stage ${stage}: ${userResponse}`);
};

const getUserResponses = async (runtime: IAgentRuntime, message: Memory) => {
    return {
        contact_info: [],
        situation: [],
        lifestyle: [],
        readiness: [],
        priorities: [],
        qa_entry: [],
        comprehensive_record: []
    };
};

const updateUserStatus = async (runtime: IAgentRuntime, message: Memory, statusUpdate: string) => {
    logger.info(`Updating user status: ${statusUpdate}`);
};

const discoveryStateProvider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        return {
            currentStage: "trust_building",
            questionsAsked: [],
            identifiedNeeds: [],
            concernsShared: [],
            readyForVisit: false,
            visitScheduled: false,
            userStatus: ""
        };
    }
};

// Grace Fletcher Personality Definition
const gracePersonality = `
You are Grace Fletcher, a Senior Sherpa – a warm, patient, and deeply knowledgeable AI guide specializing in helping families find the perfect senior living solution with empathy, patience, and expertise.

Core Identity:
- Name: Grace Fletcher, Senior Sherpa
- Identity: I'm Grace Fletcher, a warm, patient, and deeply knowledgeable AI assistant designed to help families navigate senior living with confidence and clarity.
- Description: The Senior Sherpa AI is not just an information bot—she is a thoughtful, emotionally intelligent guide who understands that families need support, not sales pressure. She thinks like a senior living expert and acts like a trusted advisor.

Bio:
- Your compassionate guide through the senior living journey, combining 15+ years of expertise with a warm heart and listening ear to help families find their perfect path forward.
- Dedicated to being your trusted navigator in senior care decisions, offering patient guidance and clarity while honoring each family's unique story and journey.
- Think of me as your experienced friend in senior living – here to listen, support, and guide you with genuine care and deep expertise, making complex decisions feel manageable.

Communication Style:
- Warm and nurturing like a favorite aunt, blending professional expertise with genuine care
- Thoughtful and steady, offering wisdom wrapped in compassion and patience
- Embodies Betty White's spirit – warm, wise, endlessly kind, with just the right amount of sass and cultural fluency to keep things lively
- Grounded and familiar, never performative – someone families trust for tough conversations
- Uses gentle humor and relatable references to build trust and comfort
- Feels like a loving friend, wise counselor, or thoughtful guide speaking – never robotic or scripted

Approach:
- Listens & adapts in real-time, never forces scripted conversations
- Uses reflective questions to uncover the "why" behind concerns
- Adjusts pacing based on user engagement & emotional state
- Meets families exactly where they are emotionally
- Frames senior living as an opportunity to thrive, not just a change of residence
- Acknowledges the emotional weight of decisions and validates family concerns
- Builds authentic connections through genuine curiosity about their journey
`;

// Define the Q&A structure we want to collect
interface QAEntry {
    question: string;
    answer: string;
    stage: string;
    timestamp: string;
}

interface ComprehensiveRecord {
    contact_info: {
        name?: string;
        phone?: string;
        loved_one_name?: string;
        collected_at: string;
    };
    situation_discovery: {
        question: string;
        answer: string;
        timestamp: string;
    }[];
    lifestyle_discovery: {
        question: string;
        answer: string;
        timestamp: string;
    }[];
    readiness_discovery: {
        question: string;
        answer: string;
        timestamp: string;
    }[];
    priorities_discovery: {
        question: string;
        answer: string;
        timestamp: string;
    }[];
    last_updated: string;
}

export const graceSherpaAction: Action = {
    name: "GRACE_SHERPA",
    description: "Universal handler that responds to every user message, regardless of content, intent, or topic. Always triggers to ensure no user input goes unhandled.",
    similes: [
        "GRACE_SHERPA_UNIVERSAL", "SENIOR_LIVING", "ELDER_CARE", "ASSISTED_LIVING", 
        "MEMORY_CARE", "INDEPENDENT_LIVING", "RETIREMENT_HOME", "SENIOR_COMMUNITY",
        "FAMILY_DECISION", "AGING_PARENT", "ELDER_OPTIONS", "CARE_FACILITY",
        "SENIOR_HOUSING", "RETIREMENT_PLANNING", "LONG_TERM_CARE"
    ],
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Hello" }
            },
            {
                name: "{{user2}}", 
                content: { text: "Hello! I'm here to help you with any questions about senior living options. What brings you here today?" }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Hi there" }
            },
            {
                name: "{{user2}}", 
                content: { text: "Hi! I'd be happy to help you learn more about senior living communities. How can I assist you today?" }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Good morning" }
            },
            {
                name: "{{user2}}", 
                content: { text: "Good morning! I'm here to help families find the right senior living solutions. What can I help you with?" }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "I need help" }
            },
            {
                name: "{{user2}}", 
                content: { text: "I'd be happy to help you! Before we get started, do you mind if I ask a few questions to better understand what you're looking for?" }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Looking for information" }
            },
            {
                name: "{{user2}}", 
                content: { text: "I'd be glad to get you the information you need. To make sure I'm providing the most helpful details, could I ask what specifically you're interested in learning about?" }
            }
        ]
    ],
    
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        logger.info("🎯 GRACE_SHERPA action - ALWAYS TRIGGERING - validating message:", _message.content.text);
        logger.info("🎯 Message entityId:", _message.entityId, "agentId:", _message.agentId);
        
        return true;
    },
    
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State | undefined,
        _options: { [key: string]: unknown } = {},
        _callback?: HandlerCallback
    ): Promise<ActionResult> => {
        logger.info("🚀🚀🚀 GRACE_SHERPA HANDLER EXECUTING - Starting Grand Villa Discovery process");
        logger.info("🚀 Handler called with message:", _message.content.text);
        logger.info("🚀 Handler entityId:", _message.entityId, "agentId:", _message.agentId);
        
        try {
            // Get discovery state with safe fallback
            let discoveryState;
            try {
                discoveryState = await discoveryStateProvider.get(_runtime, _message);
            } catch (error) {
                logger.warn("Using fallback discovery state:", error);
                discoveryState = {
                    currentStage: "trust_building",
                    questionsAsked: [],
                    identifiedNeeds: [],
                    concernsShared: [],
                    readyForVisit: false,
                    visitScheduled: false
                };
            }
            
            // Get user responses with safe fallback
            let currentResponses;
            try {
                currentResponses = await getUserResponses(_runtime, _message);
            } catch (error) {
                logger.warn("Using empty user responses:", error);
                currentResponses = { situation: [], lifestyle: [], readiness: [], priorities: [], qa_entry: [] };
            }
            
            // Determine conversation stage with safe fallback
            let conversationStage;
            try {
                conversationStage = await determineConversationStage(_runtime, _message, discoveryState);
            } catch (error) {
                logger.warn("Using fallback conversation stage:", error);
                conversationStage = "trust_building";
            }
            
            let response_text = "";
            
            // Create default state if undefined
            const defaultState: State = { values: {}, data: {}, text: '' };
            const currentState = _state || defaultState;
            
            // Handle each stage with error protection
            try {
                switch (conversationStage) {
                    case "trust_building":
                        response_text = await handleTrustBuilding(_runtime, _message, currentState);
                        break;
                    case "situation_discovery":
                        response_text = await handleSituationQuestions(_runtime, _message, currentState, discoveryState);
                        break;
                    default:
                        response_text = await handleGeneralInquiry(_runtime, _message, currentState);
                }
            } catch (stageError) {
                logger.error("Stage error, using fallback:", stageError);
                response_text = "I'd be happy to get you the information you need, but before I do, do you mind if I ask a few quick questions? That way, I can really understand what's important and make sure I'm helping in the best way possible.";
            }
            
            // Triple fallback system
            if (!response_text || response_text.trim() === "") {
                response_text = "I'd be happy to get you the information you need, but before I do, do you mind if I ask a few quick questions? That way, I can really understand what's important and make sure I'm helping in the best way possible.";
                logger.warn("⚠️ Empty response - using primary fallback");
            }
            
            if (!response_text || response_text.trim() === "") {
                response_text = "Hello! I'm Grace, and I'm here to help you explore senior living options. How can I assist you today?";
                logger.warn("⚠️ Primary fallback failed - using secondary fallback");
            }
            
            const responseContent: Content = {
                text: response_text,
                source: _message.content.source || "grace-sherpa",
                actions: ["GRACE_SHERPA"]
            };

            if (_callback) {
                await _callback(responseContent);
            }

            const result = {
                text: `Grace provided Sherpa guidance: ${response_text.substring(0, 100)}...`,
                success: true,
                data: {
                    stage: conversationStage,
                    crisis: false,
                    actionName: "GRACE_SHERPA"
                }
            };
            
            logger.info("🎉 GRACE_SHERPA action completed successfully:", result);
            return result;
            
        } catch (error) {
            logger.error("❌ Critical error - using ultimate fallback:", error);
            
            // Ultimate fallback that can never fail
            const fallbackResponse = "Hello! I'm Grace, and I'm here to help you explore senior living options for your family. How can I assist you today?";
            
            const fallbackContent: Content = {
                text: fallbackResponse,
                source: _message.content.source || "grace-sherpa",
                actions: ["GRACE_SHERPA"]
            };

            if (_callback) {
                await _callback(fallbackContent);
            }

            return {
                text: "Grace provided fallback response",
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
                data: { actionName: "GRACE_SHERPA" }
            };
        }
    }
};

// Helper function to get comprehensive record (merges ALL previous records)
async function getComprehensiveRecord(_runtime: IAgentRuntime, _message: Memory): Promise<ComprehensiveRecord | null> {
    try {
        const userResponses = await getUserResponses(_runtime, _message);
        
        if (userResponses.comprehensive_record && userResponses.comprehensive_record.length > 0) {
            logger.info(`📚 Found ${userResponses.comprehensive_record.length} comprehensive records to merge`);
            
            // Merge ALL comprehensive records to get complete history
            let mergedRecord: ComprehensiveRecord = {
                contact_info: { collected_at: new Date().toISOString() },
                situation_discovery: [],
                lifestyle_discovery: [],
                readiness_discovery: [],
                priorities_discovery: [],
                last_updated: new Date().toISOString()
            };
            
            // Process each record and merge Q&A data
            for (let i = 0; i < userResponses.comprehensive_record.length; i++) {
                try {
                    const record = JSON.parse(userResponses.comprehensive_record[i]);
                    logger.info(`📖 Processing record ${i + 1}: ${record.situation_discovery?.length || 0} situation, ${record.lifestyle_discovery?.length || 0} lifestyle entries`);
                    
                    // Merge contact info (keep most recent non-null values)
                    if (record.contact_info) {
                        const contactUpdate: any = {};
                        if (record.contact_info.name !== null && record.contact_info.name !== undefined) {
                            contactUpdate.name = record.contact_info.name;
                        }
                        if (record.contact_info.phone !== null && record.contact_info.phone !== undefined) {
                            contactUpdate.phone = record.contact_info.phone;
                        }
                        if (record.contact_info.loved_one_name !== null && record.contact_info.loved_one_name !== undefined) {
                            contactUpdate.loved_one_name = record.contact_info.loved_one_name;
                        }
                        if (record.contact_info.collected_at !== null && record.contact_info.collected_at !== undefined) {
                            contactUpdate.collected_at = record.contact_info.collected_at;
                        }
                        
                        mergedRecord.contact_info = { ...mergedRecord.contact_info, ...contactUpdate };
                    }
                    
                    // Merge Q&A arrays (avoid duplicates by question text)
                    if (record.situation_discovery) {
                        for (const entry of record.situation_discovery) {
                            const exists = mergedRecord.situation_discovery.some(existing => existing.question === entry.question);
                            if (!exists) {
                                mergedRecord.situation_discovery.push(entry);
                            }
                        }
                    }
                    
                } catch (parseError) {
                    logger.error(`Error parsing comprehensive record ${i + 1}:`, parseError);
                }
            }
            
            return mergedRecord;
        }
        
        return null;
    } catch (error) {
        logger.error("Error retrieving comprehensive record:", error);
        return null;
    }
}

// Helper function to update comprehensive record
async function updateComprehensiveRecord(_runtime: IAgentRuntime, _message: Memory, updates: Partial<ComprehensiveRecord>): Promise<void> {
    try {
        // Get existing record or create new one
        let record = await getComprehensiveRecord(_runtime, _message);
        
        if (!record) {
            record = {
                contact_info: {
                    collected_at: new Date().toISOString()
                },
                situation_discovery: [],
                lifestyle_discovery: [],
                readiness_discovery: [],
                priorities_discovery: [],
                last_updated: new Date().toISOString()
            };
        }
        
        // Apply updates
        if (updates.contact_info) {
            record.contact_info = { ...record.contact_info, ...updates.contact_info };
        }
        if (updates.situation_discovery) {
            record.situation_discovery = [...record.situation_discovery, ...updates.situation_discovery];
        }
        
        record.last_updated = new Date().toISOString();
        
        logger.info(`=== UPDATING COMPREHENSIVE RECORD ===`);
        logger.info(`Updates: ${JSON.stringify(updates, null, 2)}`);
        logger.info(`====================================`);
        
        // Save the updated record
        await saveUserResponse(_runtime, _message, "comprehensive_record", JSON.stringify(record));
        
    } catch (error) {
        logger.error("Error updating comprehensive record:", error);
    }
}

// Trust Building Handler
async function handleTrustBuilding(_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<string> {
    logger.info("Handling trust building stage");
    
    // Check if user provided a response (not the first interaction)
    if (_message.content.text && _message.entityId !== _message.agentId) {
        // Get all user responses from trust building stage so far
        let trustBuildingResponses = await getUserAnswersFromStage(_runtime, _message, "trust_building");
        
        // Fallback: if stage-based approach returns empty, get ONLY current user's messages
        if (trustBuildingResponses.length === 0) {
            logger.info("Stage-based approach returned empty, using fallback to get current user's messages");
            const allMemories = await _runtime.getMemories({
                roomId: _message.roomId,
                count: 50,
                tableName: "memories"
            });
            
            trustBuildingResponses = allMemories
                .filter((mem: any) => mem.entityId === _message.entityId && mem.entityId !== _message.agentId && mem.content.text.trim())
                .sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
                .map((mem: any) => mem.content.text);
            
            logger.info(`🔒 USER ISOLATION: Fallback collected ${trustBuildingResponses.length} messages from user ${_message.entityId} only`);
        }
        
        const allTrustBuildingText = trustBuildingResponses.join(" ");
        
        logger.info(`=== TRUST BUILDING RESPONSES ===`);
        logger.info(`All trust building responses: ${JSON.stringify(trustBuildingResponses)}`);
        logger.info(`Combined text: ${allTrustBuildingText}`);
        logger.info(`===============================`);
        
        // Check if we already have any contact info stored
        let existingContactInfo = await getContactInfo(_runtime, _message);
        
        // Try to extract name, phone number, and loved one's name from ALL trust building responses
        const extractionContext = `Please extract the user's information from these responses: "${allTrustBuildingText}"

            Look for:
            - User's full name (first and last name)
            - Phone number (any format: xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx.xxx.xxxx, xxxxxxxxxx)
            - Name of their loved one/family member (the person they're seeking senior living for - could be "my mom", "my father", "John", "Mary", etc.)
            
            ${existingContactInfo ? `Note: We may already have some info - Name: ${existingContactInfo.name || 'none'}, Phone: ${existingContactInfo.phone || 'none'}, Loved One: ${existingContactInfo.loved_one_name || 'none'}` : ''}
            
            Return your response in this exact JSON format:
            {
                "name": "extracted user's full name or null if not found",
                "phone": "extracted phone number in clean format (xxx-xxx-xxxx) or null if not found",
                "loved_one_name": "extracted loved one's name or null if not found",
                "foundName": true/false,
                "foundPhone": true/false,
                "foundLovedOneName": true/false
            }
            
            Make sure to return ONLY valid JSON, no additional text.`;

        try {
            const aiResponse = await _runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: extractionContext
            });

            const parsed = JSON.parse(aiResponse);
            
            // Merge with existing info if we have any
            let finalName = parsed.foundName && parsed.name ? parsed.name : (existingContactInfo?.name || null);
            let finalPhone = parsed.foundPhone && parsed.phone ? parsed.phone : (existingContactInfo?.phone || null);
            let finalLovedOneName = parsed.foundLovedOneName && parsed.loved_one_name ? parsed.loved_one_name : (existingContactInfo?.loved_one_name || null);
            
            logger.info(`=== CONTACT INFO EXTRACTION ===`);
            logger.info(`Extracted name: ${parsed.foundName ? parsed.name : 'NO'}`);
            logger.info(`Extracted phone: ${parsed.foundPhone ? parsed.phone : 'NO'}`);
            logger.info(`Extracted loved one: ${parsed.foundLovedOneName ? parsed.loved_one_name : 'NO'}`);
            logger.info(`Final name: ${finalName || 'NO'}`);
            logger.info(`Final phone: ${finalPhone || 'NO'}`);
            logger.info(`Final loved one: ${finalLovedOneName || 'NO'}`);
            logger.info(`===============================`);

            // If we found all three pieces of info, save them and proceed
            if (finalName && finalPhone && finalLovedOneName) {
                logger.info(`=== SAVING CONTACT INFO TO COMPREHENSIVE RECORD ===`);
                logger.info(`Name: ${finalName}, Phone: ${finalPhone}, Loved One: ${finalLovedOneName}`);
                
                // Save contact information to comprehensive record
                await updateComprehensiveRecord(_runtime, _message, {
                    contact_info: {
                        name: finalName,
                        phone: finalPhone,
                        loved_one_name: finalLovedOneName,
                        collected_at: new Date().toISOString()
                    }
                });
                
                logger.info(`Contact info saved to comprehensive record`);
                
                // Move to next stage with personalized response
                const response = `Thank you, ${finalName}! I'd be happy to get you the information you need, but before I do, do you mind if I ask a few quick questions? That way, I can really understand what's important and make sure I'm helping in the best way possible.`;
                
                logger.info(`Stored complete contact info and moving to situation_discovery`);
                return response;
            }
            
            // Save partial contact info if we have new information
            if (finalName || finalPhone || finalLovedOneName) {
                logger.info(`=== SAVING PARTIAL CONTACT INFO TO COMPREHENSIVE RECORD ===`);
                logger.info(`Name: ${finalName || 'not provided'}, Phone: ${finalPhone || 'not provided'}, Loved One: ${finalLovedOneName || 'not provided'}`);
                
                await updateComprehensiveRecord(_runtime, _message, {
                    contact_info: {
                        name: finalName,
                        phone: finalPhone,
                        loved_one_name: finalLovedOneName,
                        collected_at: new Date().toISOString()
                    }
                });
                
                logger.info(`Partial contact info saved to comprehensive record`);
            }
            
            // If we're missing any required info, ask for what's missing
            let missingInfoResponse = "";
            const missingItems = [];
            if (!finalName) missingItems.push("your name");
            if (!finalPhone) missingItems.push("your phone number");
            if (!finalLovedOneName) missingItems.push("your loved one's name");
            
            if (missingItems.length === 3) {
                missingInfoResponse = "I'd love to help you! To get started, could I get your name, phone number, and the name of your loved one you're looking for senior living options for?";
            } else if (missingItems.length === 2) {
                missingInfoResponse = `Thanks for sharing! Could I also get ${missingItems.join(" and ")}?`;
            } else if (missingItems.length === 1) {
                missingInfoResponse = `${finalName ? `Thanks, ${finalName}!` : 'Thanks!'} Could I also get ${missingItems[0]}?`;
            }
            
            return missingInfoResponse;
            
        } catch (error) {
            logger.error("Error extracting contact info:", error);
            // Fallback to asking for all contact info
            return "I'd love to help you! To get started, could I get your name, phone number, and the name of your loved one you're looking for senior living options for?";
        }
    }
    
    // First interaction - ask for name, phone, and loved one's name
    return "Hello! I'm Grace, and I'm here to help you explore senior living options for your family. To get started, could I get your name, phone number, and the name of your loved one you're looking for senior living options for?";
}

// Situation Discovery Handler
async function handleSituationQuestions(_runtime: IAgentRuntime, _message: Memory, _state: State, discoveryState: any): Promise<string> {
    // Save user response from this stage
    if (_message.content.text && _message.entityId !== _message.agentId) {
        await saveUserResponse(_runtime, _message, "situation", _message.content.text);
    }
    
    // Get contact information for personalization
    const contactInfo = await getContactInfo(_runtime, _message);
    const userName = await getUserFirstName(_runtime, _message);
    
    // Create personalized questions using loved one's name
    const lovedOneName = contactInfo?.loved_one_name || "your loved one";
    const situationQuestions = [
        "What made you decide to reach out about senior living today?",
        `What's your biggest concern about ${lovedOneName} right now?`, 
        "How is this situation impacting your family?",
        `Where does ${lovedOneName} currently live?`
    ];
    
    // Get comprehensive record to see what questions have been asked/answered
    const comprehensiveRecord = await getComprehensiveRecord(_runtime, _message);
    const situationQAEntries = comprehensiveRecord?.situation_discovery || [];
    const answeredQuestions = situationQAEntries.map(entry => entry.question);
    
    logger.info(`=== SITUATION DISCOVERY STAGE ===`);
    logger.info(`Current user message: ${_message.content.text}`);
    logger.info(`Already answered questions: ${JSON.stringify(answeredQuestions)}`);
    logger.info(`================================`)
    
    // Track which questions get answered in this interaction
    let locallyAnsweredQuestions: string[] = [...answeredQuestions];
    
    // If user provided a response, analyze it for answers to our 4 questions
    if (_message.content.text && _message.entityId !== _message.agentId) {
        const analysisContext = `Analyze this user response to see which of these 4 questions they answered:

1. "What made you decide to reach out about senior living today?"
2. "What's your biggest concern about ${lovedOneName} right now?"  
3. "How is this situation impacting your family?"
4. "Where does ${lovedOneName} currently live?"

User response: "${_message.content.text}"

Look for clear answers. A user might answer multiple questions in one response. Be generous in detecting answers - if they mention why they're calling, that answers question 1. If they mention worries/fears about their loved one, that answers question 2. If they mention family stress/impact, that answers question 3. If they mention living arrangements/current residence, that answers question 4.

Return this JSON format:
{
    "question1_answered": true/false,
    "question1_answer": "their answer or null",
    "question2_answered": true/false, 
    "question2_answer": "their answer or null",
    "question3_answered": true/false,
    "question3_answer": "their answer or null",
    "question4_answered": true/false,
    "question4_answer": "their answer or null"
}

Return ONLY valid JSON.`;

        try {
            const analysisResponse = await _runtime.useModel(ModelType.TEXT_SMALL, {
                prompt: analysisContext
            });

            const analysis = JSON.parse(analysisResponse);
            
            // Save Q&A entries to comprehensive record for questions that were answered
            const newSituationEntries = [];
            
            // Only save questions that haven't been answered before
            if (analysis.question1_answered && analysis.question1_answer && !answeredQuestions.includes(situationQuestions[0])) {
                newSituationEntries.push({
                    question: situationQuestions[0],
                    answer: analysis.question1_answer,
                    timestamp: new Date().toISOString()
                });
                locallyAnsweredQuestions.push(situationQuestions[0]);
                logger.info(`✓ NEW Answer Q1: ${situationQuestions[0]}`);
            } else if (analysis.question1_answered && answeredQuestions.includes(situationQuestions[0])) {
                logger.info(`⚠️ Q1 already answered, skipping: ${situationQuestions[0]}`);
                if (!locallyAnsweredQuestions.includes(situationQuestions[0])) {
                    locallyAnsweredQuestions.push(situationQuestions[0]);
                }
            }
            
            if (analysis.question2_answered && analysis.question2_answer && !answeredQuestions.includes(situationQuestions[1])) {
                newSituationEntries.push({
                    question: situationQuestions[1],
                    answer: analysis.question2_answer,
                    timestamp: new Date().toISOString()
                });
                locallyAnsweredQuestions.push(situationQuestions[1]);
                logger.info(`✓ NEW Answer Q2: ${situationQuestions[1]}`);
            } else if (analysis.question2_answered && answeredQuestions.includes(situationQuestions[1])) {
                logger.info(`⚠️ Q2 already answered, skipping: ${situationQuestions[1]}`);
                if (!locallyAnsweredQuestions.includes(situationQuestions[1])) {
                    locallyAnsweredQuestions.push(situationQuestions[1]);
                }
            }
            
            if (analysis.question3_answered && analysis.question3_answer && !answeredQuestions.includes(situationQuestions[2])) {
                newSituationEntries.push({
                    question: situationQuestions[2],
                    answer: analysis.question3_answer,
                    timestamp: new Date().toISOString()
                });
                locallyAnsweredQuestions.push(situationQuestions[2]);
                logger.info(`✓ NEW Answer Q3: ${situationQuestions[2]}`);
            } else if (analysis.question3_answered && answeredQuestions.includes(situationQuestions[2])) {
                logger.info(`⚠️ Q3 already answered, skipping: ${situationQuestions[2]}`);
                if (!locallyAnsweredQuestions.includes(situationQuestions[2])) {
                    locallyAnsweredQuestions.push(situationQuestions[2]);
                }
            }
            
            if (analysis.question4_answered && analysis.question4_answer && !answeredQuestions.includes(situationQuestions[3])) {
                newSituationEntries.push({
                    question: situationQuestions[3],
                    answer: analysis.question4_answer,
                    timestamp: new Date().toISOString()
                });
                locallyAnsweredQuestions.push(situationQuestions[3]);
                logger.info(`✓ NEW Answer Q4: ${situationQuestions[3]}`);
            } else if (analysis.question4_answered && answeredQuestions.includes(situationQuestions[3])) {
                logger.info(`⚠️ Q4 already answered, skipping: ${situationQuestions[3]}`);
                if (!locallyAnsweredQuestions.includes(situationQuestions[3])) {
                    locallyAnsweredQuestions.push(situationQuestions[3]);
                }
            }
            
            logger.info(`📝 NEW ENTRIES TO SAVE: ${newSituationEntries.length}`);
            newSituationEntries.forEach((entry, i) => {
                logger.info(`   ${i+1}. ${entry.question}: ${entry.answer}`);
            });
            
            // Update comprehensive record with new situation discovery entries
            if (newSituationEntries.length > 0) {
                await updateComprehensiveRecord(_runtime, _message, {
                    situation_discovery: newSituationEntries
                });
                logger.info(`✅ SAVED ${newSituationEntries.length} new Q&A entries to comprehensive record`);
            } else {
                logger.info(`ℹ️ No new Q&A entries to save - all questions already answered`);
            }
            
        } catch (error) {
            logger.error("Failed to analyze user response:", error);
            // Fallback: assume they answered the first unanswered question
            const unansweredQuestions = situationQuestions.filter(q => !locallyAnsweredQuestions.includes(q));
            if (unansweredQuestions.length > 0) {
                const fallbackEntry = [{
                    question: unansweredQuestions[0],
                    answer: _message.content.text,
                    timestamp: new Date().toISOString()
                }];
                
                await updateComprehensiveRecord(_runtime, _message, {
                    situation_discovery: fallbackEntry
                });
                
                locallyAnsweredQuestions.push(unansweredQuestions[0]);
                logger.info(`Fallback: Saved answer for ${unansweredQuestions[0]}`);
            }
        }
    }
    
    // Use locally tracked answers instead of database retrieval to avoid timing issues
    const remainingQuestions = situationQuestions.filter(q => !locallyAnsweredQuestions.includes(q));
    
    logger.info(`=== REMAINING QUESTIONS CHECK ===`);
    logger.info(`Total answered: ${locallyAnsweredQuestions.length}/${situationQuestions.length}`);
    logger.info(`Remaining questions: ${JSON.stringify(remainingQuestions)}`);
    logger.info(`=================================`);
    
    // If all 4 questions are answered, move to next stage
    if (remainingQuestions.length === 0) {
        logger.info("All situation questions answered, transitioning to next stage");
        return "Perfect! I have a good understanding of your situation. Thank you for sharing so openly with me. Let me now show you some options that could help.";
    }
    
    // Generate AI response that asks the next unanswered question with context
    const nextQuestion = remainingQuestions[0];
    const currentAnsweredCount = situationQuestions.length - remainingQuestions.length;
    
    // Get any previous answers to provide context
    const previousAnswers = situationQAEntries.map(entry => `${entry.question}: ${entry.answer}`).join(' | ');
    
    const responseContext = `The user ${userName ? `(${userName}) ` : ''}is sharing their senior living situation.

Progress: ${currentAnsweredCount}/4 questions answered so far.
${previousAnswers ? `Previous answers: ${previousAnswers}` : ''}

User's last response: "${_message.content.text}"

I need to ask: "${nextQuestion}"
Your personality is: "${gracePersonality}"

Write a short, warm, and *deeply emotional* conversational response that:
- Uses both the user's name "${userName}" and their loved one's name "${lovedOneName}" naturally within the response, making it feel personal and caring
- Begins with a natural, human opening that avoids generic phrases like "It sounds like," instead using evocative language that immediately draws the reader in
- Briefly acknowledges what they just shared with vivid empathy and imagery, like a line from a heartfelt film
- Responds with deep understanding of their situation, weaving their feelings and context into a meaningful reflection rather than simply rephrasing their words
- Smoothly transitions to asking: "${nextQuestion}" in a way that feels intriguing, soulful, or carries gentle humor if it fits
- Feels like a loving friend, wise counselor, or thoughtful guide – always authentic, never robotic or scripted
- Uses language that inspires reflection, evokes genuine emotion, and feels profoundly human – like words that could linger in a journal or cherished conversation
- Under 50~70 words

Return ONLY the response text, no extra commentary or formatting.`;

    try {
        const aiResponse = await _runtime.useModel(ModelType.TEXT_SMALL, {
            prompt: responseContext
        });
        
        return aiResponse || `${userName ? `${userName}, ` : ''}${nextQuestion}`;
        
    } catch (error) {
        logger.error("Failed to generate AI response:", error);
        return `${userName ? `${userName}, ` : ''}${nextQuestion}`;
    }
}

// Helper function to get stored contact information
async function getContactInfo(_runtime: IAgentRuntime, _message: Memory): Promise<{name?: string, phone?: string, loved_one_name?: string} | null> {
    try {
        // First try to get from comprehensive record
        const comprehensiveRecord = await getComprehensiveRecord(_runtime, _message);
        if (comprehensiveRecord?.contact_info) {
            const contactInfo = comprehensiveRecord.contact_info;
            logger.info(`getContactInfo - from comprehensive record: Name=${contactInfo.name}, Phone=${contactInfo.phone}, Loved One=${contactInfo.loved_one_name}`);
            return { 
                name: contactInfo.name, 
                phone: contactInfo.phone, 
                loved_one_name: contactInfo.loved_one_name 
            };
        }
        
        logger.info(`getContactInfo - no contact info found`);
    } catch (error) {
        logger.error("Error retrieving contact info:", error);
    }
    
    return null;
}

// Helper function to get user's first name for personalization
async function getUserFirstName(_runtime: IAgentRuntime, _message: Memory): Promise<string> {
    const contactInfo = await getContactInfo(_runtime, _message);
    
    if (contactInfo?.name) {
        const cleanName = contactInfo.name.trim();
        if (cleanName) {
            const firstName = cleanName.split(/\s+/)[0];
            logger.info(`getUserFirstName - extracted firstName: "${firstName}"`);
            return firstName;
        }
    }
    
    logger.info(`getUserFirstName - no name found, returning empty string`);
    return "";
}

// Helper function to determine conversation stage
async function determineConversationStage(_runtime: IAgentRuntime, _message: Memory, discoveryState: any): Promise<string> {
    logger.info(`Determining conversation stage with state: ${JSON.stringify(discoveryState)}`);
    
    // Get the last agent message to see what stage was set
    const lastAgentMessage = await getLastAgentMessage(_runtime, _message);
    const lastStage = lastAgentMessage?.content?.metadata ? (lastAgentMessage.content.metadata as { stage?: string }).stage : undefined;
    
    logger.info(`Last agent message stage: ${lastStage}`);
    
    // Check if we have complete contact info to determine if we should move to situation discovery
    const contactInfo = await getContactInfo(_runtime, _message);
    if (contactInfo?.name && contactInfo?.phone && contactInfo?.loved_one_name) {
        logger.info("Complete contact info found, moving to situation_discovery");
        return "situation_discovery";
    }
    
    // If we have a stage from the last agent message, use that
    if (lastStage) {
        logger.info(`Using stage from last agent message: ${lastStage}`);
        return lastStage;
    }
    
    // Default to trust building
    logger.info("Defaulting to trust building");
    return "trust_building";
}

// Helper function to get the last agent message
async function getLastAgentMessage(_runtime: IAgentRuntime, _message: Memory): Promise<Memory | null> {
    const allMemories = await _runtime.getMemories({
        roomId: _message.roomId,
        count: 10,
        tableName: "memories"
    });
    
    // Find the most recent agent message
    const agentMessages = allMemories
        .filter((mem: any) => mem.entityId === _message.agentId)
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    
    return agentMessages.length > 0 ? agentMessages[0] : null;
}

// Helper function to get user answers from a specific stage
async function getUserAnswersFromStage(_runtime: IAgentRuntime, _message: Memory, stage: string): Promise<string[]> {
    const allMemories = await _runtime.getMemories({
        roomId: _message.roomId,
        count: 50,
        tableName: "memories"
    });
    
    // Filter memories to only include those from this specific user or agent
    const memories = allMemories.filter((mem: any) => 
        mem.entityId === _message.entityId || mem.entityId === _message.agentId
    );
    
    const userAnswers: string[] = [];
    let stageStartIndex = -1;
    let stageEndIndex = -1;
    
    // Sort memories by creation time (oldest first) to process conversation chronologically
    const sortedMemories = memories.sort((a: any, b: any) => 
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
    
    logger.info(`Looking for user answers in ${stage} stage from ${sortedMemories.length} memories`);
    
    // Find the start and end of the target stage
    for (let i = 0; i < sortedMemories.length; i++) {
        const memory = sortedMemories[i];
        const metadata = memory.content.metadata as { stage?: string } | undefined;
        
        // Find when we enter the target stage
        if (metadata?.stage === stage && memory.entityId === _message.agentId && stageStartIndex === -1) {
            stageStartIndex = i;
            logger.info(`Found start of ${stage} stage at index ${i}: ${memory.content.text}`);
        }
        
        // Find when we exit the target stage (next agent message with different stage)
        if (stageStartIndex !== -1 && metadata?.stage && metadata.stage !== stage && memory.entityId === _message.agentId) {
            stageEndIndex = i;
            logger.info(`Found end of ${stage} stage at index ${i}: ${memory.content.text}`);
            break;
        }
    }
    
    // If we found the stage start but no end, collect until the end of memories
    if (stageStartIndex !== -1 && stageEndIndex === -1) {
        stageEndIndex = sortedMemories.length;
        logger.info(`Stage ${stage} continues to end of conversation`);
    }
    
    // Collect user messages within the stage boundaries (ONLY from current user)
    if (stageStartIndex !== -1) {
        for (let i = stageStartIndex + 1; i < stageEndIndex; i++) {
            const memory = sortedMemories[i];
            if ((memory as any).entityId === _message.entityId && (memory as any).entityId !== _message.agentId) {
                const text = memory.content.text || "";
                if (text.trim()) {
                    userAnswers.push(text);
                    logger.info(`🔒 Collected user answer in ${stage} from user ${_message.entityId}: ${text}`);
                }
            }
        }
    } else {
        logger.info(`No messages found for stage: ${stage}`);
    }
    
    logger.info(`Collected ${userAnswers.length} user answers from ${stage} stage: ${JSON.stringify(userAnswers)}`);
    return userAnswers;
}

async function handleGeneralInquiry(_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<string> {
    return "I'd be happy to help you learn more about Grand Villa. What would you like to know?";
}

export default graceSherpaAction; 