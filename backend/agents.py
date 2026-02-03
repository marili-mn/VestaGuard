import autogen
import os
import json
from dotenv import load_dotenv
from tools import scan_hash_virustotal, get_latest_cves, get_file_hash

load_dotenv()

# Configuration for Gemini 1.5 Flash
config_list = [
    {
        "model": "gemini-1.5-flash",
        "api_key": os.getenv("GOOGLE_API_KEY"),
        "api_type": "google",
    }
]

llm_config = {
    "config_list": config_list,
    "temperature": 0.1,
}

def initiate_analysis(content: str):
    """
    Spins up the multi-agent system with real tools.
    """
    
    # 1. Security Analyst: Can use tools to investigate
    secops = autogen.AssistantAgent(
        name="SecOps_Analyst",
        llm_config=llm_config,
        system_message="""You are an elite Security Analyst. 
        Your task is to analyze the input content for security risks.
        1. Generate a SHA-256 hash of the content using 'get_file_hash'.
        2. Check the hash on VirusTotal using 'scan_hash_virustotal'.
        3. If you see specific technologies (like 'react', 'node', 'python'), check for recent vulnerabilities using 'get_latest_cves'.
        4. Provide a technical summary of findings to the ISO Auditor."""
    )

    # 2. Compliance Officer: Orchestrates the final JSON response
    auditor = autogen.AssistantAgent(
        name="ISO_Auditor",
        llm_config=llm_config,
        system_message="""You are an ISO 27001 Auditor.
        Review the findings from SecOps_Analyst.
        Map them to specific ISO 27001 or NIST controls.
        You MUST return the FINAL response as a valid JSON object ONLY.
        JSON format:
        {
          "riskLevel": "CRITICAL" | "SUSPICIOUS" | "SAFE", 
          "score": int (0-100, where 100 is safe),
          "summary": "Detailed summary of findings including VirusTotal and CVE data", 
          "complianceGaps": [
            { "controlId": "ISO-X", "description": "...", "severity": "high"|"medium"|"low" }
          ],
          "threats": [
             { "type": "HASH"|"CVE", "value": "...", "confidence": float }
          ]
        }"""
    )

    # 3. User Proxy: The executor of tools
    user_proxy = autogen.UserProxyAgent(
        name="Admin",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=3,
        is_termination_msg=lambda x: x.get("content", "") and ("{" in x.get("content", "") and "}" in x.get("content", "")),
        code_execution_config={"work_dir": "coding", "use_docker": False}
    )

    # Register tools
    autogen.agentchat.register_function(
        scan_hash_virustotal,
        caller=secops,
        executor=user_proxy,
        name="scan_hash_virustotal",
        description="Scans a file hash on VirusTotal",
    )
    
    autogen.agentchat.register_function(
        get_latest_cves,
        caller=secops,
        executor=user_proxy,
        name="get_latest_cves",
        description="Fetches latest CVEs for a keyword",
    )

    autogen.agentchat.register_function(
        get_file_hash,
        caller=secops,
        executor=user_proxy,
        name="get_file_hash",
        description="Generates SHA-256 hash of content",
    )

    # Create group chat for orchestration
    groupchat = autogen.GroupChat(
        agents=[user_proxy, secops, auditor], 
        messages=[], 
        max_round=10,
        speaker_selection_method="auto"
    )
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

    # Start the process
    user_proxy.initiate_chat(
        manager,
        message=f"Please perform a deep security analysis on this content and return the result in the requested JSON format:\n\n{content}"
    )

    # Devolvemos tanto el JSON final como el historial para el "Wow effect" en el front
    final_report = ""
    for msg in reversed(groupchat.messages):
        if "{" in msg['content'] and "riskLevel" in msg['content']:
            final_report = msg['content']
            break
            
    return {
        "report": final_report if final_report else groupchat.messages[-1]['content'],
        "history": groupchat.messages # Aquí va toda la conversación agéntica
    }

def initiate_chat(message: str):
    """
    Handles general chat/questions with a Security Assistant context.
    """
    assistant = autogen.AssistantAgent(
        name="Security_Assistant",
        llm_config=llm_config,
        system_message="""You are VestaGuard's intelligent Security Assistant. 
        You help users understand security concepts, analyze threats, and navigate the system.
        Be concise, professional, and helpful. 
        If asked about files, remind the user to upload them for analysis.
        """
    )

    user_proxy = autogen.UserProxyAgent(
        name="User",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
        code_execution_config=False
    )

    user_proxy.initiate_chat(
        assistant,
        message=message
    )

    return user_proxy.last_message()["content"]