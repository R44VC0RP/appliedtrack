export default `
\documentclass[a4paper,10pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{parskip}  % For paragraph spacing
\\usepackage{hyperref} % For clickable links
\\usepackage{enumitem} % For customizing lists

% Custom command for consistent formatting
\newcommand{\sectiontitle}[1]{
  \vspace{0.4cm}
  \textbf{#1} \\
}

\begin{document}

\begin{center}
  \textbf \\
  Full Name \\ City, State \\
  P: Phone Number \\
  \href{mailto:email@example.com}{email@example.com} \\
\end{center}

\vspace{0.5cm}
\hrule
\vspace{0.4cm}

\today

\sectiontitle
Dear Hiring Manager,

\sectiontitle
I am writing to express my interest in joining your organization. With extensive experience and demonstrated expertise in my field, I am eager to contribute my skills to drive the success of your team.

Throughout my career, I have developed strong technical abilities and leadership skills while managing complex projects and implementing innovative solutions. My track record includes optimizing processes, developing applications, and achieving measurable results that positively impact business objectives.

I have consistently demonstrated my ability to adapt to new challenges, work effectively in team environments, and deliver high-quality results. My passion for continuous learning and problem-solving has enabled me to stay current with industry trends and best practices.

I am excited about the opportunity to bring my expertise to your organization and would welcome the chance to discuss how my background aligns with your goals. Thank you for considering my application.

\sectiontitle
Sincerely, \\
Full Name

\end{document}
`;
