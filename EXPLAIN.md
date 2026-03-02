## Setup Requirements

### Prerequisites

1. **n8n Server**: Running instance on Sumopod/VPS
2. **Backend Server**: AWS EC2 instance for API (port 3000)
3. **Google Console API**: Service account with Sheets API enabled
4. **Telegram Bot**: Bot token and channel ID configured
5. **AI Model API Key**: For sentiment analysis on backend

### Required Credentials

- **Google Sheets OAuth2**: Access to spreadsheet `15i9HIRu5EfV5weQiTuykRYOaXpBH_P4nXB9yhqSB1x8`
- **Telegram Bot API**: Bot token with channel posting permissions (Channel ID: `-1003771616433`)
- **Backend API**: Endpoint at `http://3.107.178.138:3000/api/analyse-feedback`

### Installation Steps

1. Import the n8n workflow JSON
2. Configure credentials in n8n:
   - Google Sheets Trigger OAuth2
   - Telegram Bot API
3. Deploy backend API with AI model integration
4. Set up environment variables on backend server
5. Activate the workflow in n8n

## Libraries & Services

### Core Technologies

- **n8n** (v1.x): Workflow automation platform
  - Google Sheets integration (Trigger node)
  - HTTP Request node
  - Data transformation (Set node)
  - Telegram integration

### Backend Framework Options

- **Fastify** or **Laravel**: REST API framework for feedback analysis

### Infrastructure Services

- **Sumopod/VPS**: n8n server hosting
- **AWS EC2**: Backend API server (3.107.178.138)
- **Google Console API**: Sheets API access
- **Telegram Bot API**: Message delivery

## Data Flow

1. **Trigger**: Google Sheets monitors for new rows (polls every minute)
2. **Data Capture**: New feedback entry triggers workflow with customer data
3. **API Request**: HTTP POST to backend with feedback text
   - Endpoint: `/api/analyse-feedback`
   - Payload: `{feedback_text: "customer feedback"}`
   - Timeout: 10 seconds
4. **AI Analysis**: Backend processes feedback (with multilanguage support) and returns:
   - Summary of feedback
   - Sentiment classification (positive/negative/neutral)
5. **Message Formatting**: Combines customer name, summary, sentiment, and timestamp
6. **Notification**: Sends formatted message to Telegram channel

## Assumptions & Limitations

### Current Assumptions

- Google Sheet structure remains consistent (Customer Name, Feedback columns)
- Backend API is always available at the specified IP
- Telegram channel remains accessible
- Network connectivity is stable

### Known Limitations

- **Polling Interval**: 1-minute delay for new feedback detection
- **Single Channel Output**: Only sends to one Telegram channel
- **No Batch Processing**: Processes one feedback at a time

## Logging & Monitoring

### n8n Logging

- **Execution History**: All workflow runs and their status
- **Node-level Logs**: Individual node success/failure
- **Data Flow Tracking**: Input/output data at each step
- **Error Details**: Failed executions with error messages
- **Integration Logs**: Google Sheets and Telegram API responses

### Backend Logging

- **Request History**: All incoming API calls
- **Processing Time**: AI analysis duration
- **Error Tracking**: Failed analysis attempts
- **Response Logs**: Sentiment and summary results

## Error Handling

### Current Implementation

- **Retry Logic**: Each node configured with `retryOnFail: true` and `maxTries: 2`
- **Timeout Protection**: 10-second timeout on API calls
- **Backend Error Handling**: Error catching with automatic retry on the backend server for failed analysis requests

### Recommended Improvements

- Implement exponential backoff for retries
- Add dead letter queue for failed messages
- Set up alerting for consecutive failures
- Create fallback mechanisms for API unavailability

## Improvements & Roadmap

### Implemented (Backend)

1. **Rate Limiting**: API request throttling to prevent overload
2. **Error Recovery**: Error catching with automatic retry for failed requests
3. **Multi-language Support**: Multilanguage feedback analysis (language detection/translation)

### Short-term Enhancements

1. **Webhook Trigger**: Replace polling with real-time webhook from Google Sheets
2. **Environment Variables**: Move hardcoded values to configuration
3. **Batch Processing**: Process multiple feedback entries at a time instead of one-by-one

### Long-term Improvements

1. **Load Balancing**: Multiple backend servers for high availability
2. **Queue System**: Add message queue (RabbitMQ/Redis) for async processing
3. **Analytics Dashboard**: Real-time feedback analytics and reporting
4. **Multiple Channels**: Support for multiple notification channels (Slack, Email, etc.)
5. **Feedback Categories**: Auto-categorization of feedback types
6. **Response Templates**: Automated customer response generation

## Cost Optimization

### Minimum Current Cost Drivers

- VPS (free tier)/ Sumopod hosting for n8n (IDR 20K)
- AWS EC2 instance for backend (free tier)
- Google Sheets API calls (free tier)
- AI model API usage (free tier)

### Cost-Saving Strategies

1. **Reduce Polling Frequency**: Adjust based on actual feedback volume
2. **Caching**: Cache AI analysis for similar feedback patterns
3. **Batch Processing**: Group multiple feedbacks for bulk AI analysis
4. **Reserved Instances**: Use AWS reserved instances for predictable workloads
5. **Auto-scaling**: Implement auto-scaling to reduce idle resources
6. **Free Tier Optimization**: Maximize usage of free tier services

## Security Considerations

1. **API Authentication**: Add API key authentication to backend endpoint
2. **HTTPS**: Enable SSL/TLS for all communications
3. **IP Whitelisting**: Restrict backend access to n8n server IP
4. **Secrets Management**: Use environment variables or secret managers
5. **Data Encryption**: Encrypt sensitive customer data in transit and at rest

## Maintenance

- **Weekly**: Review error logs and failed executions
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and cost review
- **Annually**: Architecture review and major upgrades

## Support & Documentation

- n8n Documentation: [https://docs.n8n.io](https://docs.n8n.io)
- Google Sheets API: [https://developers.google.com/sheets/api](https://developers.google.com/sheets/api)
- Telegram Bot API: [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api)
