<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alpha.Net - Future Technology Solutions</title>
    <style>
        /* Reset styles for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #f7fafc;
            margin: 0;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        
        /* Header with logo */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 32px 40px;
            text-align: center;
        }
        
        .logo h1 {
            font-size: 2rem;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.02em;
        }
        
        .logo .alpha {
            color: #ffffff;
        }
        
        .logo .net {
            color: #e0f2ff;
        }
        
        .logo .tagline {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.9);
            margin-top: 6px;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        /* Content sections */
        .content {
            padding: 40px;
        }
        
        .welcome-section {
            margin-bottom: 32px;
        }
        
        .welcome-section h2 {
            color: #1a202c;
            font-size: 1.5rem;
            margin-bottom: 24px;
            font-weight: 600;
        }
        
        .welcome-section p {
            color: #4a5568;
            font-size: 0.9375rem;
            line-height: 1.7;
            margin-bottom: 16px;
        }
        
        /* Feature cards */
        .features {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin: 32px 0;
        }
        
        .feature-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #667eea;
            border-radius: 6px;
            padding: 24px;
        }
        
        .feature-card h3 {
            color: #2d3748;
            font-size: 1.125rem;
            margin-bottom: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .feature-icon {
            font-size: 1.25rem;
        }
        
        .feature-card p {
            color: #4a5568;
            line-height: 1.6;
            font-size: 0.9375rem;
        }
        
        .feature-card ul {
            color: #4a5568;
            margin: 12px 0 12px 20px;
            line-height: 1.7;
            font-size: 0.9375rem;
        }
        
        .feature-card strong {
            color: #2d3748;
        }
        
        .highlight {
            color: #667eea;
            font-weight: 600;
        }
        
        /* Closing section */
        .closing-section {
            text-align: left;
            margin: 32px 0;
            padding: 20px;
            background: #edf2f7;
            border-radius: 6px;
            border-left: 4px solid #48bb78;
        }
        
        .closing-section p {
            color: #2d3748;
            line-height: 1.6;
            margin: 0;
            font-size: 0.9375rem;
        }
        
        /* Signature */
        .signature {
            text-align: left;
            margin: 32px 0 0 0;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        
        .signature p {
            color: #4a5568;
            line-height: 1.6;
            margin: 0;
            font-size: 0.9375rem;
        }
        
        .signature strong {
            color: #2d3748;
            font-weight: 600;
        }
        
        .signature a {
            color: #667eea;
            text-decoration: none;
        }
        
        .signature a:hover {
            text-decoration: underline;
        }
        
        /* Footer */
        .footer {
            background: #f7fafc;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #718096;
            font-size: 0.875rem;
            margin-bottom: 12px;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #667eea;
            text-decoration: none;
            padding: 6px 14px;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            transition: all 0.2s ease;
            font-size: 0.875rem;
        }
        
        .social-links a:hover {
            background: #edf2f7;
            border-color: #667eea;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .logo h1 {
                font-size: 1.75rem;
            }
            
            .welcome-section h2 {
                font-size: 1.25rem;
            }
            
            .feature-card {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo">
                <h1><span class="alpha">ALPHA</span><span class="net">.NET</span></h1>
                <div class="tagline">Future Technology Solutions</div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <!-- Email Header -->
            <div class="welcome-section">
                <h2>Procurement Request - Immediate Needs</h2>
                <p style="text-align: left; max-width: none; margin-bottom: 30px;">
                    <strong>Dear Alice,</strong><br><br>
                    As part of our ongoing efforts to ensure operational continuity and support upcoming internal initiatives, we have identified a set of immediate needs across three key areas: office supplies, IT infrastructure, and event logistics. These requirements are aligned with departmental activities scheduled for the current quarter and are essential to maintaining productivity and engagement across teams.
                </p>
                <p style="text-align: left; max-width: none;">
                    We kindly ask the Procurement Department to review and initiate the necessary order flows for the following:
                </p>
            </div>
            
            <!-- Procurement Items -->
            <div class="features">
                <div class="feature-card">
                    <h3><span class="feature-icon">🖊️</span> Office Stationery Supplies</h3>
                    <p><strong>Requested for internal operational use:</strong></p>
                    <ul>
                        <li>10 packs of A4 printer paper (reams of 500 sheets)</li>
                        <li>50 ballpoint pens (blue and black)</li>
                        <li>20 notebooks (A5, ruled)</li>
                        <li>10 folders (with elastic closure)</li>
                        <li>5 staplers + 5 boxes of staples</li>
                        <li>5 packs of Post-it notes (assorted colors)</li>
                    </ul>
                    <p><span class="highlight">Estimated budget: €250</span><br>
                    Please confirm delivery timelines and explore any bulk discount opportunities.</p>
                </div>
                
                <div class="feature-card">
                    <h3><span class="feature-icon">💻</span> IT Consulting Services</h3>
                    <p><strong>Required for infrastructure optimization and security enhancement:</strong></p>
                    <p>20 hours of IT consulting focused on system performance, software updates, and cybersecurity review.</p>
                    <p><span class="highlight">Estimated budget: €1,200 (€60/hour)</span><br>
                    Kindly verify consultant availability and ensure relevant certifications are in place.</p>
                </div>
                
                <div class="feature-card">
                    <h3><span class="feature-icon">🥐</span> Catering for Corporate Brunch</h3>
                    <p><strong>Planned for an internal event (date to be confirmed), with approximately 30 attendees. Requested items include:</strong></p>
                    <ul>
                        <li>Assorted pastries and baked goods</li>
                        <li>Fresh fruit platters</li>
                        <li>Coffee, tea, and juices</li>
                        <li>Vegetarian and gluten-free options</li>
                    </ul>
                    <p><span class="highlight">Estimated budget: €600 (€20/person)</span><br>
                    Please coordinate menu options, setup/cleanup logistics, and dietary accommodations.</p>
                </div>
            </div>
            
            <!-- Closing Message -->
            <div class="closing-section">
                <p>
                    We appreciate your attention to this request and remain available for any clarifications or adjustments needed.
                </p>
            </div>
            
            <!-- Signature -->
            <div class="signature">
                <p>
                    <strong>Best regards,</strong><br>
                    Internal Operations Team<br>
                    Headquarters – Alpha.Net<br>
                    <a href="mailto:internal.operations@alpha.net">internal.operations@alpha.net</a>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing Alpha.Net as your technology partner.</p>
            <p>Ready to revolutionize your business? Our experts are standing by.</p>
            
            <div class="social-links">
                <a href="#" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    LinkedIn
                </a>
                <a href="#" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.54-2.12-9.91-5.04-.42.72-.66 1.55-.66 2.44 0 1.67.85 3.14 2.14 4-.79-.03-1.53-.24-2.18-.6v.06c0 2.33 1.66 4.28 3.86 4.72-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.94 2.42 3.35 4.55 3.39-1.67 1.31-3.77 2.09-6.05 2.09-.39 0-.78-.02-1.17-.07 2.18 1.4 4.77 2.21 7.55 2.21 9.06 0 14.01-7.5 14.01-14.01 0-.21 0-.42-.02-.63.96-.69 1.8-1.56 2.46-2.55z"/>
                    </svg>
                    Twitter
                </a>
                <a href="#" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                    </svg>
                    GitHub
                </a>
                <a href="#" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Contact
                </a>
            </div>
            
            <p style="margin-top: 20px; font-size: 0.8rem;">
                © 2025 Alpha.Net | All rights reserved<br>
                If you no longer wish to receive these emails, <a href="#" style="color: #667eea;">unsubscribe here</a>
            </p>
        </div>
    </div>
</body>
</html>