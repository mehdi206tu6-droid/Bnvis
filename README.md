<div align="center">
<img width="1200" height="475" alt="Benvis Life OS Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Benvis Life OS | سیستم عامل هوشمند زندگی بنویس

**An AI-powered Life OS to organize your goals, habits, and daily life, built with React and the Google Gemini API.**

**یک سیستم عامل هوشمند زندگی مبتنی بر هوش مصنوعی برای سازماندهی اهداف، عادت‌ها و زندگی روزمره شما که با React و Gemini API ساخته شده است.**

[View in AI Studio](https://ai.studio/apps/drive/1_0TlTfRXthK4ZI0q9b28lQvjc1p_5IoC)

</div>

---

**Benvis (بنویس - "Write" in Persian)** is more than just a to-do list; it's a smart life management system designed to be your central hub for productivity, wellness, and personal growth. By leveraging the power of the Google Gemini API, Benvis understands your natural language inputs, analyzes your patterns, and provides intelligent insights to help you live a more organized and intentional life.

## ✨ Core Philosophy

The goal of Benvis is to create a "Life OS" that reduces the friction of managing daily tasks and long-term ambitions. Instead of juggling multiple apps, you can write, speak, and plan in one place. The integrated AI acts as your personal assistant, coach, and analyst, turning raw data into actionable wisdom.

## 🚀 Key Features

Benvis is packed with intelligent features designed to cover every aspect of your life:

*   🧠 **Smart Command Center (Benvis Widget):** The heart of the app. Use natural language (text or voice) to add anything to your system.
    *   *"یادداشت بردار: ایده برای پروژه جدید..."* → Creates a new note.
    *   *"فردا ساعت ۲ جلسه با تیم فروش"* → Creates a calendar event.
    *   *"خریدم: قهوه ۳۵ هزار تومان"* → Logs a financial transaction.
    *   *"هدف جدید: یادگیری زبان اسپانیایی"* → Creates a new goal.

*   🎯 **Advanced Goal Management:**
    *   Create simple, measurable goals with deadlines.
    *   Use the **AI Journey Planner** to turn a big goal (e.g., "Learn a new language") into a complete roadmap with milestones and actionable tasks.

*   🔄 **Intelligent Habit Tracker:**
    *   Track both good habits (to build) and bad habits (to break).
    *   Visualize your progress with streak counters.
    *   Link habits directly to goals to see how your daily actions contribute to your big ambitions.

*   ✨ **AI-Powered Dashboard Widgets:**
    *   **Mood Weather:** Analyzes your journal entries and activities to provide a daily "mood forecast."
    *   **Energy Prediction:** Predicts your energy level for tomorrow based on your sleep quality and today's activities.
    *   **Daily Briefing:** Get an AI-generated summary of your day's priorities and schedule.
    *   **Daily Prompt:** Receive a unique, AI-generated prompt for journaling and self-reflection.

*   💬 **Smart Assistant Hub:**
    *   A powerful chatbot with adjustable tones (friendly, formal, empathetic).
    *   **Image Analyzer & Editor:** Ask questions about an image or use prompts to edit it, all powered by Gemini's multimodal capabilities.
    *   **AI Agents:** A suite of specialized AI tools for tasks like calculating your health score, building a new identity, analyzing your finances, and more.

*   💰 **Comprehensive Financial Center:**
    *   Manage multiple accounts (bank, cash, card).
    *   Track income and expenses with customizable categories.
    *   Set monthly budgets and visualize your spending.
    *   **SMS Analyzer:** Paste your bank SMS messages, and the AI will automatically extract and categorize your transactions.

*   ❤️ **Women's Health Module:**
    *   Track your menstrual cycle, log symptoms, and view predictions for your period and fertile window.
    *   Receive AI-generated daily tips tailored to your cycle phase.
    *   Securely share cycle information with a partner.

*   🌙 **Mindfulness & Focus Tools:**
    *   **Quiet Zone:** A Pomodoro timer to help you focus on your goals without distractions.
    *   **Night Routine:** A guided, step-by-step process to help you reflect on your day, practice gratitude, and prepare for a restful sleep.
    *   **Weekly Review:** Get a comprehensive, AI-generated report on your weekly progress, achievements, and areas for improvement.

*   🎨 **Customizable Themes:**
    *   Personalize your experience with a variety of themes, from "Cyberpunk Neon" to "Zen Garden."
    *   Enable or disable beautiful, lightweight background animations.

*   🏆 **Gamification System:**
    *   Stay motivated by earning XP for completing tasks and habits.
    *   Level up your life and unlock achievements for reaching milestones.

## 🛠️ Technology Stack

*   **Frontend:** [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
*   **AI:** [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Offline Support:** PWA enabled with `vite-plugin-pwa`

## ⚙️ Getting Started / Local Setup

Follow these steps to run the Benvis Life OS app on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later is recommended)
*   `npm` or a compatible package manager

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/benvis-life-os.git
    cd benvis-life-os
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    *   Create a file named `.env` in the root of the project.
    *   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add your API key to the `.env` file:
        ```
        GEMINI_API_KEY="YOUR_API_KEY_HERE"
        ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 📂 Project Structure

The codebase is organized to be clean and maintainable:

```
/
├── public/              # Static assets (icons, etc.)
├── src/
│   ├── components/      # All React components, organized by feature
│   ├── lib/             # AI agent definitions and configurations
│   ├── App.tsx          # Main application component with state management and data migration
│   ├── index.tsx        # Application entry point
│   └── types.ts         # All TypeScript type definitions
├── .env                 # Environment variables (contains API key)
├── index.html           # Main HTML file
└── vite.config.ts       # Vite build and server configuration
```

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-awesome-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some awesome feature'`).
5.  Push to the branch (`git push origin feature/your-awesome-feature`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
