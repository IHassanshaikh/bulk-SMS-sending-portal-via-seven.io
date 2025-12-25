import axios from "axios";

export const sendSMS = async (phone, message) => {
    try {
        const response = await axios.post(
            "https://gateway.seven.io/api/sms",
            {
                to: phone,
                text: message,
                from: "447462290295", // OLD UK Number
                // from: "18623872983",    // NEW US Number
                dlr: "yes", // ✅ ENABLE delivery reports
                dlr_url: "https://api.teachers-corner.com/api/sms/webhook", // ✅ webhook
                performance_tracking: 1
            },
            {
                headers: {
                    "X-Api-Key": process.env.SEVEN_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "SentWith": "js"
                }
            }
        );

        console.log(`[Seven.io DEBUG] Response for ${phone}:`, JSON.stringify(response.data, null, 2));

        const messageId = response.data?.messages?.[0]?.id;

        const resBody = response.data;
        let isActuallySent = false;
        let statusText = "FAILED";

        console.log(`[Strict-Check] Seven.io raw response:`, JSON.stringify(resBody));

        if (typeof resBody === 'object' && resBody !== null) {
            const globalCode = resBody.success; // Global request status (e.g., "100")
            const hasMessages = Array.isArray(resBody.messages) && resBody.messages.length > 0;

            // SEVEN.IO LOGIC: Even if global success is 100, the individual message might fail
            const msgObj = hasMessages ? resBody.messages[0] : {};

            // Check if the individual message was successful
            const isMsgSuccess = msgObj.success === true || msgObj.success === "true" || msgObj.status === "success";

            // Confirm both the API accepted the request AND the message was actually sent
            isActuallySent = (globalCode == 100 || globalCode == 101) && isMsgSuccess;

            statusText = isActuallySent ? "SENT" : (msgObj.error_text || "FAILED");

            if (!isActuallySent) {
                console.error(`[Seven.io FAIL] Reason: ${msgObj.error_text || resBody.error || "Unknown Error"}`);
            }
        } else if (typeof resBody === 'string') {
            isActuallySent = resBody.startsWith("100") || resBody.startsWith("101");
            statusText = isActuallySent ? "SENT" : "FAILED";
        }

        return {
            success: isActuallySent,
            statusText: statusText.toUpperCase(),
            messageId,
            response: resBody
        };
    } catch (error) {
        console.error("[sendSMS Error]:", error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
};