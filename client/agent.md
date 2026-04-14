# ProjectWEb - Client (Frontend) Agent Instructions

Welcome! You are operating in the **Frontend (Client)** of the ProjectWEb repository. This document outlines the architecture, data management, and operational boundaries for the React application.

## 1. Directory Architecture

The frontend is built with React/Vite (TypeScript). It separates components strictly by language domain (English vs Japanese), alongside shared global constructs.

```mermaid
flowchart TD
    classDef main fill:#e1f5fe,stroke:#01579b,stroke-width:1px;
    classDef shared fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px;
    classDef eng fill:#fbe9e7,stroke:#bf360c,stroke-width:1px;
    classDef jap fill:#fff3e0,stroke:#e65100,stroke-width:1px;
    
    Client[client/]:::main
    
    Src[src/]:::main
    Client --> Src
    
    %% Shared Base
    Routes[routes/ (Global Routing)]:::shared
    SharedComponents[components/ (Nav, Chat)]:::shared
    Services[services/ (API & Base Services)]:::shared
    
    Src --> Routes
    Src --> SharedComponents
    Src --> Services
    
    %% Domains
    English[english/]:::eng
    Japanese[japanese/]:::jap
    
    Src --> English
    Src --> Japanese
    
    %% Japanese Sub-modules
    Japanese --> jpPages[pages/ (Main Views)]
    Japanese --> jpPractice[practice/ (Interactive Tests)]
    Japanese --> jpComponents[components/ (UI Elements)]
    Japanese --> jpUtils[utils/ (State & Config)]
    
    %% English Sub-modules
    English --> enPages[pages/ (Main Views)]
    English --> enPractice[practice/ (Interactive Tests)]
    English --> enComponents[components/ (UI Elements)]
    English --> enUtils[utils/ (State & Config)]
```

## 2. Global State & Context

*   **Routing:** Handled via custom structured nested routes (see `routes/AppRoutes.tsx`, `routes/language-routes/`). Routes are dynamically protected via `ProtectedRoute.tsx`.
*   **State Management:** Localized practice storage is handled in the respective `utils/usePracticeStore.ts` (acting as state machines for SRS/practice sessions).
*   **API Logic:** Core API requests originate from `apiClient.tsx` and domain-specific hooks.
*   **Styles:** Component styles rely on central `index.css` alongside Tailwind (if used) or modular CSS.

## 3. Practice Flow Architecture

Both English and Japanese modules follow an identical interaction structure:

1.  **View Generation**: `xPracticePage.tsx` acts as the Controller.
2.  **Exercise Rendering**: Chooses sub-components from the `practice/` directory based on the current scenario (`MultipleChoicePractice.tsx`, `VoicePractice.tsx`, etc.).
3.  **Result Evaluation**: Local store `usePracticeStore.ts` computes streak/lapses and triggers API persistence hooks.

## 4. Required Agent Behaviors

1.  **Component Isolation:** Do not mix Japanese-specific configurations (e.g., stroke data, Romaji logic) into English modules, and vice versa. Always check if a shared feature should go into the root `src/components` instead of a domain folder.
2.  **Before modifying State (usePracticeStore.ts):** Run an impact analysis to trace usage across all Practice UI components. Modifying SRS data keys or return types easily breaks the UI rendering sequence.
3.  **Verification:** Modifications to forms (in `forms/`) or practice components (in `practice/`) must be verified against their host container layout (`PracticeWrapper.tsx` / `PracticeLayout.tsx`).
