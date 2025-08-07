const testResumeText = `
TUSHAR MATHUR
QA Automation Lead
tushar.mathur@builder.ai
+91-9876543210

PROFESSIONAL SUMMARY
Experienced QA Automation Lead with expertise in Python, Selenium, pytest, and CI/CD pipelines. Strong background in building scalable test automation frameworks and leading QA teams.

TECHNICAL SKILLS
• Programming: Python, JavaScript, Java
• Testing Tools: Selenium, pytest, TestNG, JUnit
• CI/CD: Jenkins, GitLab CI, GitHub Actions
• Cloud: AWS, Docker, Kubernetes

WORK EXPERIENCE
QA Automation Lead (2023-2025)
Builder.ai
• Led QA initiatives for product launches
• Managed and mentored QA team
• Developed test automation frameworks using Python and Robot Framework

Senior QA Engineer (2021-2023)
HCL Technologies
• Created API Test Automation framework using Python, Pytest
• Reduced test execution time from 4 hours to 1.5 hours
• Worked with Apple as client

EDUCATION
Bachelor of Science in Electronics And Communications Engineering
Sharda University (2009-2013)
`;

async function testGeminiExtraction() {
  const apiKey = 'AIzaSyCpcy5i_OWpI_kHQ1Eq_dgfWRh5JeKz5KI';
  
  const prompt = `
You are an expert resume parser. Extract the following information from this resume text and return ONLY a valid JSON object with these exact fields:

{
  "name": "Full Name",
  "email": "Email Address", 
  "phone": "Phone Number",
  "designation": "Current/Recent Job Title",
  "pastCompanies": ["Company 1", "Company 2", "Company 3"],
  "skillset": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
}

Rules:
- Extract the person's full name (first and last name)
- Extract the primary email address (not example/test emails)
- Extract the primary phone number
- Extract their current or most recent job title/designation
- Extract up to 5 past companies they've worked for
- Extract up to 10 key technical skills, programming languages, tools, or technologies
- If any field cannot be found, use "Not specified" for text fields or empty array for arrays
- Return ONLY the JSON object, no other text

Resume text:
${testResumeText}
`;

  try {
    console.log('Testing Gemini extraction...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const rawBody = await response.text();
    console.log('Gemini response:', rawBody);
    
    const data = JSON.parse(rawBody);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response text from Gemini');
    }

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const extractedInfo = JSON.parse(jsonMatch[0]);
    console.log('✅ Gemini extracted info:', JSON.stringify(extractedInfo, null, 2));

  } catch (error) {
    console.error('❌ Error testing Gemini extraction:', error);
  }
}

testGeminiExtraction(); 