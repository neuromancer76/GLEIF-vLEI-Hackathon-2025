import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { ApiResponse } from './types';
import { swaggerDocument, swaggerOptions } from './config/swagger';

// Load environment variables early in the application lifecycle
dotenv.config();

/**
 * VLEI KERIA API Application Class
 * 
 * This class implements the main Express.js application for the VLEI KERIA proxy API.
 * It serves as a facade layer that abstracts complex KERIA agent operations and provides
 * a simplified REST API for VLEI credential management.
 * 
 * ARCHITECTURAL DECISIONS:
 * 
 * 1. Facade Pattern: Hides the complexity of KERI protocol operations behind simple REST endpoints
 * 2. Layered Security: Implements helmet for security headers, CORS for cross-origin control
 * 3. Comprehensive Logging: Uses Morgan for HTTP request logging and custom error tracking
 * 4. API Versioning: Built-in support for API versioning to maintain backward compatibility
 * 5. Swagger Documentation: Self-documenting API with interactive documentation
 * 6. Graceful Error Handling: Structured error responses with appropriate HTTP status codes
 * 
 * INTEGRATION POINTS:
 * - KERIA Agents: Communicates with local KERIA agents for credential operations
 * - VLEI Schema Server: Resolves credential schemas and validation rules
 * - Supplier Portal BFF: Provides credential verification and issuance services
 * - Frontend Applications: Enables browser-based VLEI credential interactions
 */
class App {
  public app: Application;
  private port: number;
  private docsPath: string;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.docsPath = process.env.SWAGGER_PATH || '/api-docs';
    
    this.initializeMiddleware();
    this.initializeDocumentation();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middleware in the correct order for security and functionality.
   * 
   * MIDDLEWARE ORDERING RATIONALE:
   * 1. Security headers first (helmet) - protects against common vulnerabilities
   * 2. CORS configuration - enables controlled cross-origin access for web frontends
   * 3. Request logging - captures all requests for debugging and monitoring
   * 4. Body parsing - handles JSON and URL-encoded request bodies for credential operations
   * 5. Custom middleware - adds request metadata for tracking and debugging
   */
  private initializeMiddleware(): void {
    // Security middleware - adds security headers to prevent XSS, clickjacking, etc.
    // Critical for VLEI applications that handle sensitive credential data
    this.app.use(helmet());
    
    // CORS middleware - configured for multi-origin support required by VLEI ecosystem
    // Allows supplier portal frontend, admin interfaces, and third-party integrations
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Support multiple frontends
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],   // Standard REST operations
      allowedHeaders: ['Content-Type', 'Authorization'],      // Support for auth tokens
      credentials: true  // Enable cookies/auth for secure VLEI operations
    }));

    // Logging middleware - comprehensive HTTP request logging for debugging and audit
    // Important for VLEI compliance and troubleshooting credential issuance issues
    this.app.use(morgan('combined'));

    // Body parsing middleware - handles credential JSON payloads up to 10MB
    // Large limit accommodates complex VLEI credential structures and batch operations
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timestamp middleware - adds timing metadata for performance monitoring
    // Helps track KERI operation latencies and identify bottlenecks in credential workflows
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api';
    const apiVersion = process.env.API_VERSION || 'v1';
    
    // API routes
    this.app.use(`${apiPrefix}/${apiVersion}`, routes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        data: {
          message: 'VLEI KERIA API',
          version: '1.0.0',
          status: 'running',
          endpoints: {
            health: `${apiPrefix}/${apiVersion}/health`,
            issueRiskLensCredentials: `${apiPrefix}/${apiVersion}/credentials/issue-risk-lens`,
            revokeCredential: `${apiPrefix}/${apiVersion}/credentials/revoke`,
            assignCredentialToApplication: `${apiPrefix}/${apiVersion}/credentials/assign-to-application`
          }
        },
        timestamp: new Date().toISOString()
      };
      res.json(response);
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.originalUrl} not found`
        },
        timestamp: new Date().toISOString()
      };
      res.status(404).json(response);
    });
  }

  /**
   * Initialize Swagger documentation route
   */
  private initializeDocumentation(): void {
    this.app.use(this.docsPath, swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

    this.app.get(`${this.docsPath}.json`, (req: Request, res: Response) => {
      res.json(swaggerDocument);
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    });
  }

  /**
   * Start the server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 VLEI KERIA API server running on port ${this.port}`);
      console.log(`📖 API Documentation available at: http://localhost:${this.port}/api/v1/health`);
      console.log(`🔗 Base URL: http://localhost:${this.port}`);
    });
  }
}

// Extend Express Request interface for custom properties
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
    }
  }
}

export default App;