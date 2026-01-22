
async function extractPdfText(buffer) {
  try {
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}


// Extract candidate name from resume text
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Accept Title Case OR ALL CAPS names
  const namePatterns = [
    /^([A-Z][a-z]+)(\s+[A-Z][a-z]+){1,3}$/,
    /^([A-Z]{2,})(\s+[A-Z]{2,}){1,3}$/
  ];

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (namePatterns.some(p => p.test(line))) {
      return line;
    }
  }

  return null;
}


// Extract job role/title from resume
function extractRole(text) {
  const rolePatterns = [
    /(?:(?:Senior|Junior|Lead|Principal|Staff)\s+)?(?:Software|Full[- ]?Stack|Front[- ]?End|Back[- ]?End|DevOps|Data|Machine Learning|AI)\s+(?:Engineer|Developer|Architect|Scientist)/i,
    /(?:Product|Project|Engineering|Technical)\s+Manager/i,
    /(?:UI|UX|Product)\s+Designer/i,
    /(?:Data|Business)\s+Analyst/i,
    /(?:QA|Test)\s+Engineer/i
  ];

  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  // Fallback scan
  const lines = text.split('\n');
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (
      line.length > 5 &&
      line.length < 50 &&
      /(developer|engineer|manager|designer)/i.test(line)
    ) {
      return line;
    }
  }

  return null;
}


// Normalize skill aliases & formatting

function normalizeSkill(skill) {
  let s = skill
    .trim()
    .replace(/\.+/g, '.')     
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const canonical = {
    javascript: 'JavaScript',
    react: 'React',
    'react.js': 'React',
    node: 'Node.js',
    'node.js': 'Node.js',
    docker: 'Docker',
    aws: 'Aws'
  };

  const key = s.replace(/\s/g, '');
  return canonical[key] || s.charAt(0).toUpperCase() + s.slice(1);
}


//Extract skills from resume (dynamic + section-aware)
function extractSkills(text) {
  const skills = new Set();

  // Detect SKILLS section
  const sectionMatch = text.match(
    /(?:SKILLS|TECHNICAL SKILLS|TECHNOLOGIES|EXPERTISE)[:\s]*([\s\S]*?)(?=\n[A-Z]{2,}|\n\n|$)/i
  );

  // ✅ THIS IS WHERE YOUR LINE GOES
  const sourceText = sectionMatch
    ? sectionMatch[1]
    : text.split('\n').slice(0, 40).join('\n');

  // Tokenize
  const tokens = sourceText
    .split(/[\n,•|/]/)
    .map(s => s.trim())
    .filter(Boolean);

  tokens.forEach(token => {
    if (
      token.length >= 2 &&
      token.length <= 30 &&
      token.split(' ').length <= 4 &&
      !/\d/.test(token) &&
      !token.toLowerCase().includes('experience')
    ) {
      skills.add(normalizeSkill(token));
    }
  });

  return Array.from(skills);
}


// Extract years of experience from resume
function extractYearsOfExperience(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
    /experience[:\s]*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s+in/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  // Date range estimation
  const dateRanges = text.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/gi);
  if (dateRanges) {
    let totalYears = 0;
    const currentYear = new Date().getFullYear();

    dateRanges.forEach(range => {
      const match = range.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = /\d{4}/.test(match[2]) ? parseInt(match[2], 10) : currentYear;
        totalYears += end - start;
      }
    });

    return Math.min(totalYears, 50);
  }

  return null;
}


// Parse resume text into structured data
export function parseResumeText(text) {
  return {
    name: extractName(text),
    role: extractRole(text),
    skills: extractSkills(text),
    yearsOfExperience: extractYearsOfExperience(text),
    rawText: text
  };
}
// Main function to parse resume from buffer and mimetype
export async function parseResume(buffer, mimetype) {
  let text;

  if (mimetype === 'application/pdf') {
    text = await extractPdfText(buffer);
  } else if (mimetype === 'text/plain') {
    text = buffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type. Only PDF and TXT files are allowed.');
  }

  if (!text || !text.trim()) {
    throw new Error('Resume appears to be empty or could not be parsed.');
  }

  return parseResumeText(text);
}
