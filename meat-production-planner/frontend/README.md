# Meat Production Planner Frontend

This is the React frontend for the Meat Production Planning System.

## Features

- **Sales Planning**: Plan sales by customer and product with daily/weekly/bulk views
- **Production Planning**: Plan production based on sales needs and worker availability
- **Worker Management**: Track worker availability and vacations
- **Product Management**: Manage products and their cost breakdowns
- **Customer Management**: Manage customers and their specific pricing
- **Pricing Analysis**: Analyze margins and pricing coverage
- **Dashboard**: KPIs, charts, and quick overview of the system status
- **Reports**: Generate and export various reports

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:8000/api
```

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/        # React contexts (Auth, App)
├── pages/           # Page components
├── services/        # API services
├── utils/          # Utility functions
└── App.js          # Main app component
```

## Key Dependencies

- React 18
- React Router v6
- Tailwind CSS
- Chart.js
- Axios
- date-fns
- react-hot-toast