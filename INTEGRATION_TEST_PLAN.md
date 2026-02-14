# SyncScript Integration Test Plan

## Overview
This document provides a comprehensive testing strategy for validating the complete SyncScript application with both frontend and backend components working together.

## Pre-Test Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created and configured
- [ ] Frontend dependencies installed: `npm install`
- [ ] Environment variables set in `.env.local`
- [ ] Database migrations applied
- [ ] Backend services running or deployed
- [ ] Browser DevTools console clear of errors

---

## Test Suite 1: Authentication Flow

### Test 1.1: User Registration
**Objective**: Verify new user can create account

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Enter new email: `testuser@example.com`
3. Enter password: `TestPassword123!`
4. Confirm password: `TestPassword123!`
5. Click "Sign Up"

**Expected Results**:
- [ ] No validation errors
- [ ] Success message displays
- [ ] Page redirects to login
- [ ] User record created in Supabase

**Actual Result**: _________________

---

### Test 1.2: User Login
**Objective**: Verify existing user can log in

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Enter email: `testuser@example.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"

**Expected Results**:
- [ ] No login errors
- [ ] Redirects to `/dashboard`
- [ ] User email displays in header
- [ ] Session token stored in localStorage

**Actual Result**: _________________

---

### Test 1.3: Password Reset
**Objective**: Verify password reset flow

**Steps**:
1. On login page, click "Forgot Password?"
2. Enter registered email
3. Click "Send Reset Link"

**Expected Results**:
- [ ] Success message displays
- [ ] "Check Your Email" page shown
- [ ] Reset email sent (check email/spam)
- [ ] Can follow link to reset password

**Actual Result**: _________________

---

### Test 1.4: Sign Out
**Objective**: Verify user can sign out

**Steps**:
1. While logged in, click "Sign Out" button
2. Observe redirect

**Expected Results**:
- [ ] Session cleared from localStorage
- [ ] Redirects to `/login`
- [ ] Dashboard inaccessible without re-login
- [ ] New login required

**Actual Result**: _________________

---

## Test Suite 2: Vault Management

### Test 2.1: View Dashboard
**Objective**: Verify dashboard loads and displays vaults

**Steps**:
1. Log in with test account
2. Navigate to `/dashboard`
3. Observe page load

**Expected Results**:
- [ ] Dashboard loads within 2 seconds
- [ ] User greeting displays correct email
- [ ] "Create New Vault" button visible
- [ ] Existing vaults display in grid
- [ ] No loading spinner after load
- [ ] No console errors

**Actual Result**: _________________

---

### Test 2.2: Create Vault
**Objective**: Verify new vault can be created

**Steps**:
1. On dashboard, click "Create New Vault"
2. Enter vault name: "Test Vault"
3. Click "Create Vault"
4. Observe new vault appears

**Expected Results**:
- [ ] Vault creation form appears
- [ ] Form validates input
- [ ] Vault created in database
- [ ] New vault appears in grid
- [ ] Can click new vault to open
- [ ] Success message shows

**Actual Result**: _________________

---

### Test 2.3: View Vault Detail
**Objective**: Verify vault detail page loads

**Steps**:
1. Click on a vault in dashboard
2. Wait for page to load

**Expected Results**:
- [ ] Vault detail page loads
- [ ] Vault name displays in header
- [ ] Source count displays
- [ ] "Add URL" input visible
- [ ] "Upload File" button visible
- [ ] Empty state if no sources
- [ ] Back button works

**Actual Result**: _________________

---

### Test 2.4: Delete Vault
**Objective**: Verify vault can be deleted

**Steps**:
1. On dashboard, hover over vault
2. Click trash icon on vault
3. Confirm deletion if prompted

**Expected Results**:
- [ ] Delete button clickable
- [ ] Vault removed from list
- [ ] Vault removed from database
- [ ] Page updates without refresh
- [ ] Success message shows

**Actual Result**: _________________

---

## Test Suite 3: Source Management

### Test 3.1: Add Source by URL
**Objective**: Verify URL source can be added

**Steps**:
1. In vault detail, enter URL: `https://example.com/research.pdf`
2. Click "Add URL"
3. Observe source list updates

**Expected Results**:
- [ ] URL input accepts valid URLs
- [ ] "Add URL" button submits
- [ ] Loading indicator shows
- [ ] New source appears in list
- [ ] Source displays URL
- [ ] Source record created in database
- [ ] No console errors

**Actual Result**: _________________

---

### Test 3.2: Upload File
**Objective**: Verify file upload works

**Steps**:
1. In vault detail, click "Upload File"
2. Drag a PDF file to upload area (or click browse)
3. Select a local file
4. Click "Upload" button
5. Wait for completion

**Expected Results**:
- [ ] Upload form appears
- [ ] Drag-drop area accepts files
- [ ] File selector dialog works
- [ ] Upload progress shows
- [ ] File uploaded to storage
- [ ] Checksum calculated
- [ ] Source record created
- [ ] File appears in sources list
- [ ] File size < 50MB accepted
- [ ] Large files rejected with error

**Actual Result**: _________________

---

### Test 3.3: View Source
**Objective**: Verify source details can be viewed

**Steps**:
1. Click on source in list
2. Navigate to source page

**Expected Results**:
- [ ] Source detail page loads
- [ ] Source title displays
- [ ] Source metadata shows
- [ ] Date created displays
- [ ] URL link works (if web source)
- [ ] Download available (if file)

**Actual Result**: _________________

---

### Test 3.4: Delete Source
**Objective**: Verify source can be deleted

**Steps**:
1. In vault, hover over source
2. Click trash icon on source card
3. Confirm if prompted

**Expected Results**:
- [ ] Delete button visible
- [ ] Source removed from list
- [ ] Database record deleted
- [ ] If file, storage deleted
- [ ] Page updates immediately
- [ ] Success message shows

**Actual Result**: _________________

---

## Test Suite 4: File Operations

### Test 4.1: File Upload with Validation
**Objective**: Verify file upload validation

**Steps**:
1. In vault, open file uploader
2. Try to upload different file types
3. Test file size limits

**Expected Results**:
- [ ] PDF files accepted
- [ ] DOCX files accepted
- [ ] CSV files accepted
- [ ] PNG/JPG files accepted
- [ ] Other formats show error
- [ ] Files > 50MB rejected
- [ ] Empty files rejected
- [ ] Checksum calculated correctly

**Actual Result**: _________________

---

### Test 4.2: Checksum Verification
**Objective**: Verify file integrity checking

**Steps**:
1. Upload file
2. Download file
3. Calculate hash of downloaded file

**Expected Results**:
- [ ] Original file hash stored
- [ ] Downloaded file hash matches
- [ ] Checksums verified on server
- [ ] Corrupted files detected
- [ ] Audit trail logs checksums

**Actual Result**: _________________

---

### Test 4.3: Signed URL Access
**Objective**: Verify secure file access

**Steps**:
1. Upload file
2. Get signed URL
3. Share URL with someone
4. Access URL without auth

**Expected Results**:
- [ ] Signed URL generated
- [ ] URL has expiration
- [ ] Unauthenticated access works
- [ ] URL expires after time
- [ ] Expired URL shows error
- [ ] Bucket policy enforced

**Actual Result**: _________________

---

## Test Suite 5: Settings & User Profile

### Test 5.1: View Settings
**Objective**: Verify settings page loads

**Steps**:
1. Click user menu or navigate to `/settings`
2. Observe settings page

**Expected Results**:
- [ ] Settings page loads
- [ ] Email displays (read-only)
- [ ] Display name shows
- [ ] Account creation date visible
- [ ] Sign out button present
- [ ] Change password link visible

**Actual Result**: _________________

---

### Test 5.2: Update Profile
**Objective**: Verify profile updates work

**Steps**:
1. On settings page, update display name
2. Click "Save Changes"
3. Verify change persists

**Expected Results**:
- [ ] Display name input editable
- [ ] Save button submits
- [ ] Success message shows
- [ ] Change stored in database
- [ ] Page refreshes with new data
- [ ] Change visible on next login

**Actual Result**: _________________

---

## Test Suite 6: Real-Time Updates

### Test 6.1: Real-Time Vault Updates
**Objective**: Verify real-time vault changes

**Steps**:
1. Open vault in two browser windows
2. Create vault in window 1
3. Watch window 2

**Expected Results**:
- [ ] New vault appears in window 2 instantly
- [ ] No page refresh needed
- [ ] WebSocket connection active
- [ ] Updates within 1 second

**Actual Result**: _________________

---

### Test 6.2: Real-Time Source Updates
**Objective**: Verify real-time source changes

**Steps**:
1. Open vault in two windows
2. Add source in window 1
3. Watch window 2

**Expected Results**:
- [ ] New source appears instantly in window 2
- [ ] No page refresh needed
- [ ] Metadata displays correctly
- [ ] Delete reflected instantly

**Actual Result**: _________________

---

## Test Suite 7: Error Handling

### Test 7.1: Network Error Handling
**Objective**: Verify app handles network errors

**Steps**:
1. Disable internet connection
2. Try to load data
3. Re-enable internet

**Expected Results**:
- [ ] Error message displays
- [ ] Retry option appears
- [ ] No infinite loading
- [ ] Graceful error display
- [ ] Recovery works on reconnect

**Actual Result**: _________________

---

### Test 7.2: Validation Error Handling
**Objective**: Verify form validation

**Steps**:
1. Try to create vault without name
2. Try to upload invalid file
3. Try to add invalid email

**Expected Results**:
- [ ] Form validation error shows
- [ ] Clear error message
- [ ] Form doesn't submit
- [ ] Input highlighted
- [ ] User can correct and retry

**Actual Result**: _________________

---

### Test 7.3: Authentication Error Handling
**Objective**: Verify auth errors handled

**Steps**:
1. Try login with wrong password
2. Try access protected route without auth
3. Try signup with existing email

**Expected Results**:
- [ ] Wrong password error message
- [ ] Protected routes redirect to login
- [ ] Duplicate email shows error
- [ ] Clear action to resolve
- [ ] No sensitive data exposed

**Actual Result**: _________________

---

## Test Suite 8: Performance

### Test 8.1: Page Load Speed
**Objective**: Verify acceptable load times

**Steps**:
1. Open DevTools Performance tab
2. Load each page
3. Measure load time

**Expected Results**:
- [ ] Login page < 2 seconds
- [ ] Dashboard < 3 seconds
- [ ] Vault detail < 3 seconds
- [ ] Settings < 2 seconds
- [ ] No layout shift
- [ ] Core Web Vitals pass

**Actual Result**: _________________

---

### Test 8.2: Data Loading Performance
**Objective**: Verify data loads efficiently

**Steps**:
1. Create 50+ vaults
2. Open dashboard
3. Measure load time
4. Measure scroll performance

**Expected Results**:
- [ ] Dashboard still responsive
- [ ] Pagination works if needed
- [ ] No UI lag on scroll
- [ ] Images lazy-load
- [ ] Network requests batched

**Actual Result**: _________________

---

## Test Suite 9: Security

### Test 9.1: Session Security
**Objective**: Verify session handling

**Steps**:
1. Log in
2. Check localStorage for tokens
3. Try to access token
4. Log out
5. Check token cleared

**Expected Results**:
- [ ] JWT token stored securely
- [ ] Token not accessible via JavaScript (ideally httpOnly)
- [ ] Token clears on logout
- [ ] No token in URL
- [ ] Token rotates on refresh

**Actual Result**: _________________

---

### Test 9.2: Authorization Security
**Objective**: Verify access control

**Steps**:
1. Create vault as User A
2. Try to access as User B
3. Try to modify other's vault

**Expected Results**:
- [ ] User B can't access vault
- [ ] Can't modify other user's data
- [ ] RLS policies enforced
- [ ] Database blocks unauthorized access
- [ ] Frontend prevents navigation

**Actual Result**: _________________

---

### Test 9.3: File Upload Security
**Objective**: Verify file security

**Steps**:
1. Upload file
2. Check filename sanitization
3. Try to access other user's file
4. Check file permissions

**Expected Results**:
- [ ] Filenames sanitized
- [ ] No path traversal possible
- [ ] Other users can't access files
- [ ] Signed URLs only work for owner
- [ ] Virus scanning (if configured)

**Actual Result**: _________________

---

## Test Suite 10: Cross-Browser

### Test 10.1: Chrome Browser
**Objective**: Verify works in Chrome

**Steps**:
1. Open application in Chrome
2. Run through main workflows
3. Check console for errors

**Expected Results**:
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Layout correct

**Actual Result**: _________________

---

### Test 10.2: Firefox Browser
**Objective**: Verify works in Firefox

**Steps**:
1. Open application in Firefox
2. Run through main workflows
3. Check console for errors

**Expected Results**:
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Layout correct

**Actual Result**: _________________

---

### Test 10.3: Safari Browser
**Objective**: Verify works in Safari

**Steps**:
1. Open application in Safari
2. Run through main workflows
3. Check console for errors

**Expected Results**:
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Layout correct

**Actual Result**: _________________

---

## Test Suite 11: Mobile/Responsive

### Test 11.1: Mobile Layout
**Objective**: Verify mobile responsiveness

**Steps**:
1. Open DevTools mobile view
2. Set to iPhone 12 size
3. Test all pages
4. Test touch interactions

**Expected Results**:
- [ ] Layout adapts to mobile
- [ ] Buttons easily clickable (44x44px)
- [ ] No horizontal scroll
- [ ] Forms are mobile-friendly
- [ ] Navigation works on mobile

**Actual Result**: _________________

---

### Test 11.2: Tablet Layout
**Objective**: Verify tablet responsiveness

**Steps**:
1. Set DevTools to iPad size
2. Test all pages
3. Test landscape and portrait

**Expected Results**:
- [ ] Layout adapts properly
- [ ] Two-column layouts work
- [ ] Touch interactions work
- [ ] Performance acceptable

**Actual Result**: _________________

---

## Test Suite 12: Accessibility

### Test 12.1: Keyboard Navigation
**Objective**: Verify keyboard access

**Steps**:
1. Use only Tab key to navigate
2. Use Enter/Space to activate buttons
3. Test form submission with keyboard

**Expected Results**:
- [ ] All elements reachable by Tab
- [ ] Focus indicator visible
- [ ] Buttons activatable with Enter
- [ ] Forms submittable with Enter
- [ ] No keyboard traps

**Actual Result**: _________________

---

### Test 12.2: Screen Reader
**Objective**: Verify screen reader compatibility

**Steps**:
1. Use NVDA or JAWS
2. Navigate page
3. Read content

**Expected Results**:
- [ ] All text readable
- [ ] Buttons labeled properly
- [ ] Form labels associated
- [ ] Images have alt text
- [ ] Error messages announced

**Actual Result**: _________________

---

## Defect Log

### Defects Found

| ID | Description | Severity | Status | Notes |
|----|-------------|----------|--------|-------|
| 1  |             | HIGH     | OPEN   |       |
| 2  |             | MEDIUM   | OPEN   |       |
| 3  |             | LOW      | OPEN   |       |

---

## Test Summary

### Results Overview
- **Total Tests**: 47
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Pass Rate**: ___%

### By Test Suite
| Suite | Tests | Passed | Failed | Pass Rate |
|-------|-------|--------|--------|-----------|
| Authentication | 4 | ___ | ___ | __% |
| Vault Management | 4 | ___ | ___ | __% |
| Source Management | 4 | ___ | ___ | __% |
| File Operations | 3 | ___ | ___ | __% |
| Settings | 2 | ___ | ___ | __% |
| Real-Time | 2 | ___ | ___ | __% |
| Error Handling | 3 | ___ | ___ | __% |
| Performance | 2 | ___ | ___ | __% |
| Security | 3 | ___ | ___ | __% |
| Cross-Browser | 3 | ___ | ___ | __% |
| Mobile | 2 | ___ | ___ | __% |
| Accessibility | 2 | ___ | ___ | __% |

---

## Sign-Off

**Test Lead**: _________________  
**Date**: _________________  
**Status**: [ ] Pass [ ] Fail [ ] Conditional Pass

**Comments**:
_________________________________________________
_________________________________________________
_________________________________________________

---

## Appendix

### Test Environment
- **Browser**: Chrome 120+
- **OS**: Windows 10 / macOS 13 / Ubuntu 22.04
- **Network**: High-speed (>10 Mbps)
- **Screen**: 1920x1080 (desktop)
- **Mobile**: iPhone 12 / Pixel 6

### Credentials
- **Test Email**: testuser@example.com
- **Test Password**: TestPassword123!

### Tools
- Chrome DevTools
- Firefox Developer Tools
- Safari Web Inspector
- Lighthouse
- WebPageTest

### References
- Next.js Documentation
- Supabase Documentation
- React Testing Library
- Cypress Documentation

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Next Review**: After deployment
