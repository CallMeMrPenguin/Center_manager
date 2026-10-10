#!/usr/bin/env python3
"""
Cloudflare WAF Automation Tool for Center Manager App
Enables Googlebot, PageSpeed Insights, and Lighthouse to bypass Cloudflare 403 Challenges
completely via the Cloudflare v4 REST API without opening a web browser.
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.error
import urllib.parse

CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
DEFAULT_DOMAIN = "upkidscentermanager.io.vn"

CRAWLER_EXPRESSION = (
    '(cf.client.bot) or '
    '(http.user_agent contains "Googlebot") or '
    '(http.user_agent contains "Chrome-Lighthouse") or '
    '(http.user_agent contains "PageSpeed") or '
    '(http.user_agent contains "PTST") or '
    '(http.user_agent contains "HeadlessChrome")'
)

def make_cf_request(endpoint, token=None, email=None, api_key=None, method="GET", data=None):
    url = f"{CLOUDFLARE_API_BASE}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")

    if token:
        req.add_header("Authorization", f"Bearer {token}")
    elif email and api_key:
        req.add_header("X-Auth-Email", email)
        req.add_header("X-Auth-Key", api_key)
    else:
        raise ValueError("Missing Cloudflare API credentials (Token or Email + Global Key required)")

    if data is not None:
        body = json.dumps(data).encode("utf-8")
        req.data = body

    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except Exception:
            return {"success": False, "errors": [{"message": f"HTTP {e.code}: {e.reason}", "raw": err_body}]}
    except Exception as e:
        return {"success": False, "errors": [{"message": str(e)}]}

def get_zone_id(domain, token=None, email=None, api_key=None):
    res = make_cf_request(f"/zones?name={domain}", token=token, email=email, api_key=api_key)
    if not res.get("success") or not res.get("result"):
        print(f"[!] Khong tim thay zone cho ten mien '{domain}'. Loi: {res.get('errors')}")
        return None
    return res["result"][0]["id"]

def allow_crawlers_waf_rule(zone_id, token=None, email=None, api_key=None):
    """
    Creates or updates a WAF custom rule to skip challenges for bots and crawlers.
    """
    print(f"[*] Dang lay danh sach WAF rulesets cho Zone {zone_id}...")
    ruleset_res = make_cf_request(f"/zones/{zone_id}/rulesets/phases/http_request_firewall_custom/entry", token=token, email=email, api_key=api_key)
    
    rule_payload = {
        "description": "Allow Googlebot, PageSpeed, and Lighthouse Crawlers",
        "expression": CRAWLER_EXPRESSION,
        "action": "skip",
        "action_parameters": {
            "products": ["bic", "hot", "rateLimit", "securityLevel", "waf"]
        },
        "enabled": True
    }

    if ruleset_res.get("success") and ruleset_res.get("result"):
        ruleset_id = ruleset_res["result"]["id"]
        rules = ruleset_res["result"].get("rules", [])
        
        # Check if rule already exists
        existing_rule_idx = None
        for i, r in enumerate(rules):
            if "Googlebot" in r.get("description", "") or "Lighthouse" in r.get("description", ""):
                existing_rule_idx = i
                break
        
        if existing_rule_idx is not None:
            rules[existing_rule_idx] = rule_payload
            print("[*] Da tim thay rule cu, dang cap nhat...")
        else:
            rules.insert(0, rule_payload)
            print("[*] Dang them rule moi vao dau danh sach...")

        update_res = make_cf_request(
            f"/zones/{zone_id}/rulesets/{ruleset_id}",
            token=token, email=email, api_key=api_key,
            method="PUT",
            data={"rules": rules}
        )
        if update_res.get("success"):
            print("[+] THANH CONG: Da cap nhat WAF Custom Rule cho phep Googlebot & PageSpeed!")
            return True
        else:
            print(f"[!] Loi khi cap nhat ruleset: {update_res.get('errors')}")
            return False
    else:
        # Create new ruleset if not exists
        print("[*] Khoi tao ruleset moi cho phase http_request_firewall_custom...")
        create_res = make_cf_request(
            f"/zones/{zone_id}/rulesets",
            token=token, email=email, api_key=api_key,
            method="POST",
            data={
                "name": "Custom WAF Rules",
                "kind": "zone",
                "phase": "http_request_firewall_custom",
                "rules": [rule_payload]
            }
        )
        if create_res.get("success"):
            print("[+] THANH CONG: Da tao WAF Custom Rule cho phep Googlebot & PageSpeed!")
            return True
        else:
            print(f"[!] Loi khi tao ruleset: {create_res.get('errors')}")
            return False

def test_crawler_access(domain=DEFAULT_DOMAIN):
    """
    Tests access to the target domain using various User-Agents.
    """
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = f"https://{domain}/"
    user_agents = {
        "Default Chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Chrome-Lighthouse": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Chrome-Lighthouse",
        "PageSpeed Insights": "Mozilla/5.0 (compatible; PageSpeed/1.0; +https://developers.google.com/speed/pagespeed/insights/)"
    }

    print(f"\n=======================================================")
    print(f" KIEM TRA TRUY CAP WEBSITE: {url}")
    print(f"=======================================================")

    for name, ua in user_agents.items():
        req = urllib.request.Request(url)
        req.add_header("User-Agent", ua)
        try:
            with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                status = resp.status
                cf_ray = resp.headers.get("CF-RAY", "None")
                print(f"[{name:18}] -> HTTP {status} OK (CF-RAY: {cf_ray})")
        except urllib.error.HTTPError as e:
            cf_mitigated = e.headers.get("Cf-Mitigated", "None")
            cf_ray = e.headers.get("CF-RAY", "None")
            print(f"[{name:18}] -> HTTP {e.code} ({e.reason}) | Cf-Mitigated: {cf_mitigated} | CF-RAY: {cf_ray}")
        except Exception as e:
            print(f"[{name:18}] -> Loi ket noi: {e}")
    print(f"=======================================================\n")

def main():
    parser = argparse.ArgumentParser(description="Cloudflare WAF Automation Tool for Center Manager")
    parser.add_argument("--domain", default=DEFAULT_DOMAIN, help=f"Domain name (default: {DEFAULT_DOMAIN})")
    parser.add_argument("--token", default=os.getenv("CF_API_TOKEN") or os.getenv("CLOUDFLARE_API_TOKEN"), help="Cloudflare API Token")
    parser.add_argument("--email", default=os.getenv("CF_EMAIL"), help="Cloudflare Account Email")
    parser.add_argument("--key", default=os.getenv("CF_API_KEY"), help="Cloudflare Global API Key")
    parser.add_argument("--test", action="store_true", help="Test live HTTP access with crawlers")
    
    args = parser.parse_args()

    if args.test or len(sys.argv) == 1:
        test_crawler_access(args.domain)
        if len(sys.argv) == 1 and not args.token and not args.key:
            print("De cau hinh WAF rule tu dong, hay chay:")
            print(f"  py scripts/setup_cloudflare_waf.py --token <YOUR_CLOUDFLARE_API_TOKEN>")
            print("hoac:")
            print(f"  py scripts/setup_cloudflare_waf.py --email <YOUR_EMAIL> --key <YOUR_GLOBAL_API_KEY>")
            return

    if not args.token and not (args.email and args.key):
        print("[!] Thieu thong tin dang nhap Cloudflare API.")
        print("Huong dan lay Cloudflare API Token:")
        print("1. Truy cap dash.cloudflare.com/profile/api-tokens")
        print("2. Chon 'Create Token' -> Template 'Edit zone DNS' hoac 'Custom Token' voi quyen: Zone.Cache Purge, Zone.Zone Settings, Zone.Zone WAF")
        print("3. Chay lenh: py scripts/setup_cloudflare_waf.py --token <TOKEN_CUA_BAN>")
        return

    zone_id = get_zone_id(args.domain, token=args.token, email=args.email, api_key=args.key)
    if not zone_id:
        sys.exit(1)

    success = allow_crawlers_waf_rule(zone_id, token=args.token, email=args.email, api_key=args.key)
    if success:
        print("\n[*] Dang kiem tra lai quyen truy cap cua crawler sau khi cap nhat WAF...")
        test_crawler_access(args.domain)

if __name__ == "__main__":
    main()
