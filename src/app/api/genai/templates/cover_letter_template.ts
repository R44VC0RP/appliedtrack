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
  Ryan Vogel \\ Jacksonville, FL \\
  P: +1 (904) 608-6893 \\
  \href{mailto:jobs@theryanvogel.com}{jobs@theryanvogel.com} \\
\end{center}

\vspace{0.5cm}
\hrule
\vspace{0.4cm}

\today

\sectiontitle
Dear Hiring Manager,

\sectiontitle
I am writing to express my interest in the [Position Name] at [Company Name]. With a background in Information Technology and hands-on experience in systems administration and software development, I am eager to contribute my skills to drive the success of your organization.

In my role as Systems Administrator for the City of Neptune Beach, I managed a Windows Active Directory-based network and developed internal applications to optimize productivity. My leadership skills were further honed while handling a multi-million-dollar budget and implementing disaster recovery solutions.

Additionally, my entrepreneurial venture, Mandarin 3D Prints, showcases my abilities in software development and digital marketing, achieving impressive sales growth and customer satisfaction. I am passionate about problem-solving, innovation, and driving meaningful results.

I am excited about the opportunity to bring my expertise to [Company Name] and would welcome the chance to discuss how my background aligns with your goals. Thank you for considering my application.

\sectiontitle
Sincerely, \\
Ryan Vogel

\end{document}
`;
