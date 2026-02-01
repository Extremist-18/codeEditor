# codeEditor

A web-based code editor that allows users to write, compile, and execute C++ programs directly from the browser.  
The project focuses on integrating a simple frontend editor with a backend C++ execution engine using containerized execution.

---

## Features

- Browser-based interface for writing C++ code
- Backend service to compile and execute C++ programs
- Isolated code execution using Docker containers
- Clear separation between frontend, backend, and execution logic
- Designed for local development and learning purposes

---


## Future work (Imp)
- The current implementation experiences high latency for computationally intensive workloads.
- Improve performance by reusing warm containers instead of creating a new container for each execution, significantly reducing startup overhead.
- Reduce end-to-end execution latency through optimized compilation caching and execution pipeline improvements.
