// Test script to verify email extraction
const resumeText = `TUSHAR
MATHUR
mathurt24@gmail.com
+917838642496
PROFESSIONAL SUMMARY
Dynamic QA Enthusiast with extensive experience in test
automation management. I develop robust automation frameworks,
significantly enhancing test coverage and efficiency using Python
and Selenium. A proven mentor, I foster continuous learning and
drive strategic QA initiatives.
Ghaziabad, UP 201014
https://www.linkedin.com
/in/tushar-mathur-54332410
TECHNICAL SKILLS
Python
Robot Framework
Test strategy creation
Test framework development
Expert test automation
Team collaboration
Quality assurance expertise
Test Management
Continuos Integration`;

// Email extraction logic
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const allEmails = resumeText.match(emailPattern);
console.log("All emails found:", allEmails);

const emailMatch = resumeText.match(emailPattern);
const email = emailMatch ? emailMatch[0] : 'candidate@example.com';
console.log("Selected email:", email); 