import os
import requests
import json
import hashlib

def get_file_hash(content: str):
    """Generates SHA-256 hash for a given string content."""
    return hashlib.sha256(content.encode()).hexdigest()

def scan_hash_virustotal(file_hash: str):
    """
    Scans a file hash (SHA256/MD5) against VirusTotal API.
    """
    api_key = os.getenv("VIRUSTOTAL_API_KEY")
    if not api_key or "tu_virustotal" in api_key:
        return "Error: VIRUSTOTAL_API_KEY not configured."

    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    headers = {"x-apikey": api_key}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            stats = data['data']['attributes']['last_analysis_stats']
            malicious = stats['malicious']
            return f"VirusTotal Scan: {malicious} vendors flagged this file as malicious. Stats: {json.dumps(stats)}"
        elif response.status_code == 404:
            return "VirusTotal: Hash not found in database (Unknown file)."
        else:
            return f"VirusTotal Error: {response.status_code}"
    except Exception as e:
        return f"VirusTotal Connection Failed: {str(e)}"

def get_latest_cves(keyword: str = "security"):
    """
    Fetches the latest CVEs related to a specific technology from CIRCL.lu.
    """
    try:
        url = f"https://cve.circl.lu/api/search/{keyword}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Return top 3 most recent
            top_cves = data[:3]
            summary = [f"{item['id']} (CVSS {item.get('cvss', 'N/A')}): {item['summary'][:100]}..." for item in top_cves]
            return f"Latest Vulnerabilities for '{keyword}':\n" + "\n".join(summary)
        return "No specific CVEs found."
    except Exception as e:
        return f"CVE Lookup Failed: {str(e)}"
