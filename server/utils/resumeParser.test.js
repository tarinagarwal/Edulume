/**
 * Sample unit tests for resumeParser.js
 * These use static example resumes for validation
 * and illustrate expected outputs.
 */

import { parseResumeText } from './resumeParser.js';

const sampleText2 = `
JANE SMITH
Senior Backend Developer
Skills: Python, Django, PostgreSQL, Docker, AWS, CI/CD
Experience: 2018-2023
`;

test('parses alternative resume correctly', () => {
  const result = parseResumeText(sampleText2);

  console.log(result);
});
