export default String.raw`
\documentclass[a4paper,10pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{parskip}  
\usepackage{hyperref} 
\usepackage{enumitem} 

\begin{document}

\begin{center}
  \textbf \\
  P: Phone Number \\
  \href{mailto:email@example.com}{email@example.com} \\
\end{center}

\vspace{0.5cm}
\hrule
\vspace{0.4cm}

\sectiontitle{Professional Summary}
Experienced professional with demonstrated expertise in relevant field, seeking to leverage skills and abilities in target role.

\sectiontitle{Education}
\textbf{University Name}, Location \\
Degree Type, Expected Graduation Date \\
Major in Field of Study, Minor in Secondary Field

\sectiontitle{Experience}
\textbf{Company Name}, Location \\
Job Title  \hfill Start Date – End Date \\
\begin{itemize}[leftmargin=*]
\item Key achievement or responsibility with quantifiable results
\item Notable project or initiative with measurable impact
\item Significant contribution to team or organization
\item Leadership experience or important skill demonstration
  \item Technical implementation or system management
  \item Process improvement or efficiency gain
\end{itemize}

\textbf{Previous Company}, Location \\
Job Title  \hfill Start Date – End Date \\
\begin{itemize}[leftmargin=*]
  \item Major accomplishment with specific metrics
  \item Key project or initiative outcome
  \item Important responsibility or achievement
  \item Notable improvement or optimization
\end{itemize}

\textbf{Earlier Position}, Location \\
Job Title  \hfill Start Date – End Date \\
\begin{itemize}[leftmargin=*]
  \item Significant achievement with measurable results
  \item Key responsibility or project outcome
  \item Notable contribution or improvement
\end{itemize}

\sectiontitle{Projects}
\textbf{Project Name if any}  \hfill Date Range \\
\begin{itemize}[leftmargin=*]
  \item Brief description of project and its impact or significance
\end{itemize}

\sectiontitle{Skills}
\begin{itemize}[leftmargin=*] 
  \item insert skills here
\end{itemize}

\end{document}
`;
