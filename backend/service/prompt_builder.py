from prompts.system_prompt import SYSTEM_PROMPT


class PromptBuilder:

    @staticmethod
    def build_prompt(
        user_question,
        contract_data,
        conversation_history
    ):

        # Conversation History
        if conversation_history:
            history = ""
            for message in conversation_history:
                history += (
                    f"{message['role'].capitalize()}: "
                    f"{message['content']}\n"
                )
        else:
            history = "No previous conversation."

        # Contract Information
        contract_information = ""

        for clause in contract_data:
            contract_information += f"""
Clause Type:
{clause.clause_type}

Risk Level:
{clause.risk_level}

Original Clause:
{clause.raw_text}

Plain English:
{clause.translated_text}

------------------------------------------------
"""

        prompt = f"""
{SYSTEM_PROMPT}

================================================
CONTRACT INFORMATION
================================================

{contract_information}

================================================
CONVERSATION HISTORY
================================================

{history}

================================================
USER QUESTION
================================================

{user_question}

================================================
INSTRUCTIONS
================================================

Answer professionally.

Use ONLY the contract information provided above.

If the requested information is unavailable, politely say so.

Do not invent clauses or legal advice.

Keep responses clear and concise.
"""

        return prompt