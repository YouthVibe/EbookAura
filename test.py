#!/usr/bin/env python3
"""
EbookAura API Testing Script
Tests the production API endpoints at https://ebookaura.onrender.com/
"""

import requests
import json
import time
import sys

# Base URL for the production API
BASE_URL = "https://ebookaura.onrender.com/api"

# Terminal colors for better readability
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Authentication credentials
auth_token = None
api_key = None

def print_result(name, success, status_code=None, data=None, error=None):
    """Prints the test result with appropriate colors"""
    if success:
        print(f"{Colors.GREEN}✓ {name} - Success{Colors.ENDC}")
        if status_code:
            print(f"  Status Code: {status_code}")
        if data:
            if isinstance(data, dict) and 'message' in data:
                print(f"  Response: {data['message']}")
            elif isinstance(data, list) and len(data) > 0:
                print(f"  Retrieved {len(data)} items")
            else:
                print(f"  Data: {str(data)[:100]}...")
    else:
        print(f"{Colors.FAIL}✗ {name} - Failed{Colors.ENDC}")
        if status_code:
            print(f"  Status Code: {status_code}")
        if error:
            print(f"  Error: {error}")
        if data:
            print(f"  Data: {data}")

def test_endpoint(method, endpoint, auth=False, payload=None, name=None):
    """Tests an API endpoint and prints the result"""
    if name is None:
        name = f"{method} {endpoint}"
    
    print(f"\n{Colors.BLUE}Testing: {name}{Colors.ENDC}")
    
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if auth and auth_token and api_key:
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'X-API-Key': api_key
        }
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, headers=headers, json=payload)
        elif method == 'PUT':
            headers['Content-Type'] = 'application/json'
            response = requests.put(url, headers=headers, json=payload)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            print_result(name, False, error="Unknown HTTP method")
            return None
        
        try:
            data = response.json()
        except:
            data = response.text
            
        success = response.status_code >= 200 and response.status_code < 300
        print_result(name, success, response.status_code, data)
        return data if success else None
        
    except Exception as e:
        print_result(name, False, error=str(e))
        return None

def run_tests():
    global auth_token, api_key
    
    print(f"{Colors.HEADER}{Colors.BOLD}=== EbookAura Production API Tests ==={Colors.ENDC}")
    print(f"Testing API at: {BASE_URL}\n")
    
    # ------- Public Endpoints -------
    
    print(f"\n{Colors.CYAN}=== Testing Public Endpoints ==={Colors.ENDC}")
    
    # Check if the server is running
    server_data = test_endpoint('GET', '/books', name="Server Status Check")
    
    if server_data is None:
        print(f"\n{Colors.FAIL}Server is not responding correctly. Exiting tests.{Colors.ENDC}")
        return
        
    # Get book categories
    categories = test_endpoint('GET', '/books/categories')
    
    # Get book tags
    tags = test_endpoint('GET', '/books/tags')
    
    # If we have books, test getting a specific book
    if isinstance(server_data, list) and len(server_data) > 0:
        book_id = server_data[0]['_id']
        test_endpoint('GET', f'/books/{book_id}', name=f"Get Book Details (ID: {book_id})")
        
        # Test book download increment
        test_endpoint('POST', f'/books/{book_id}/download', name=f"Increment Book Downloads (ID: {book_id})")
        
        # Test book reviews
        test_endpoint('GET', f'/books/{book_id}/reviews', name=f"Get Book Reviews (ID: {book_id})")
        
        # Test book rating
        test_endpoint('GET', f'/books/{book_id}/rating', name=f"Get Book Rating (ID: {book_id})")
    
    # ------- Authentication -------
    
    print(f"\n{Colors.CYAN}=== Testing Authentication ==={Colors.ENDC}")
    print(f"{Colors.WARNING}Note: You'll need to manually enter test credentials.{Colors.ENDC}")
    
    # Ask for credentials - in a real scenario you might use environment variables
    print("\nEnter test credentials (Leave blank to skip auth tests):")
    username = input("Username/Email: ").strip()
    password = input("Password: ").strip()
    
    if username and password:
        login_data = test_endpoint('POST', '/auth/login', payload={
            'email': username,
            'password': password
        }, name="User Login")
        
        if login_data and 'token' in login_data and 'apiKey' in login_data:
            auth_token = login_data['token']
            api_key = login_data['apiKey']
            print(f"{Colors.GREEN}Authentication successful. Testing authenticated endpoints...{Colors.ENDC}")
            
            # ------- Authenticated Endpoints -------
            
            print(f"\n{Colors.CYAN}=== Testing Authenticated Endpoints ==={Colors.ENDC}")
            
            # Get current user
            user_data = test_endpoint('GET', '/auth/me', auth=True, name="Get Current User")
            
            # Get user bookmarks
            test_endpoint('GET', '/users/bookmarks', auth=True, name="Get User Bookmarks")
            
            # Test user profile
            test_endpoint('GET', '/users/profile', auth=True, name="Get User Profile")
            
            if isinstance(server_data, list) and len(server_data) > 0:
                book_id = server_data[0]['_id']
                
                # Try toggling bookmark (this will either add or remove)
                test_endpoint('POST', '/users/bookmarks', auth=True, payload={
                    'bookId': book_id
                }, name=f"Toggle Bookmark for Book (ID: {book_id})")
        else:
            print(f"{Colors.WARNING}Authentication failed. Skipping authenticated endpoints.{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}No credentials provided. Skipping authenticated endpoints.{Colors.ENDC}")
    
    # ------- Summary -------
    
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== Test Summary ==={Colors.ENDC}")
    print(f"API Status: {Colors.GREEN}Available{Colors.ENDC}")
    print(f"Public Endpoints: {Colors.GREEN}Tested{Colors.ENDC}")
    
    if auth_token and api_key:
        print(f"Authenticated Endpoints: {Colors.GREEN}Tested{Colors.ENDC}")
    else:
        print(f"Authenticated Endpoints: {Colors.WARNING}Skipped{Colors.ENDC}")
    
    print(f"\nAll tests completed. Check the results above for any failures.")

if __name__ == "__main__":
    run_tests()
