# Deploy and Host Bot-ApiSWS on Railway

Bot-ApiSWS is an advanced enterprise AI assistant that bridges WhatsApp with the SWS ERP system. Using OpenAI's Assistant API, it automates complex tasks like real-time balance inquiries, account summaries, payment link generation, and technical service reporting, providing a seamless self-service experience for customers while reducing operational overhead.

## About Hosting Bot-ApiSWS

Hosting Bot-ApiSWS on Railway involves deploying a high-performance Node.js environment integrated with multiple cloud services. The bot utilizes BuilderBot (Baileys) for WhatsApp connectivity and features a robust session persistence layer via Supabase to ensure continuous operation across deployments. The system orchestrates real-time calls to the SWS API for live data and syncs master records through Google Sheets. Railway manages the containerized lifecycle, environment variables, and automatic scalability, allowing the bot to handle high message volumes with low latency while maintaining secure connections to your management backend and AI infrastructure.

## Common Use Cases

- **Automated Customer Service**: Provide 24/7 self-service for customers to check account balances, download invoices, and request payment links (Mercado Pago).
- **Logistics & Delivery Inquiries**: Allow users to query delivery days, verify route zones, and find nearby service points based on GPS or address data.
- **Incident & Technical Support**: Facilitate the reporting of technical issues and the creation of support tickets directly from WhatsApp, with automatic routing to responsible staff.

## Dependencies for Bot-ApiSWS Hosting

- **Node.js**: Enterprise runtime for handling the bot logic and ERP integrations.
- **OpenAI API Key**: Essential for natural language processing and executing custom tool-calling operations.
- **Supabase Credentials**: Required for storing WhatsApp session data and ensuring persistence.

### Deployment Dependencies

- [OpenAI Assistant Console](https://platform.openai.com/assistants) - Required to manage the AI model and instructions.
- [SWS ERP API](https://sistemaws.com/) - Necessary for real-time integration with your management system.
- [Google Cloud Console](https://console.cloud.google.com/) - Required for Google Sheets and Maps API integrations.
- [Supabase](https://supabase.com/) - Used for session and file persistence management.

### Implementation Details

Bot-ApiSWS features a proprietary `AssistantResponseProcessor` that converts AI-generated tags into ERP actions. It includes specialized logic for Latin American logistics, such as calculating business-day closure dates for incidents and hierarchical client-branch data extraction, ensuring data integrity across all SWS API modules.

## Why Deploy Bot-ApiSWS on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Bot-ApiSWS on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.

---

**Desarrollado por Pereyra Hugo** - [pereyrahugor@gmail.com](mailto:pereyrahugor@gmail.com)  
**Sitio web:** [https://clientesneurolinks.com/](https://clientesneurolinks.com/)
