// Keep this list in sync with careermatch_search in supabase/production.sql.
const singleWordSkills = new Set([
  "bash", "c", "c#", "c++", "css", "docker", "excel", "figma", "git", "go", "html",
  "java", "javascript", "kotlin", "kubernetes", "linux", "node.js", "numpy", "pandas",
  "php", "postgresql", "python", "react", "ruby", "rust", "sql", "swift", "tableau", "typescript",
]);

export function normalizeSkill(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeProfileSkills(values: string[]) {
  const skills = values.flatMap((value) => value.split(/[,;\r\n]+/).flatMap((entry) => {
    const skill = normalizeSkill(entry);
    const words = skill.split(" ");
    // Recover unambiguous lists such as "python c++" without splitting names like "power bi".
    return words.length > 1 && words.every((word) => singleWordSkills.has(word)) ? words : [skill];
  }));
  return [...new Set(skills.filter(Boolean))];
}
