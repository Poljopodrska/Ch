# Ch Project Constitution

## Core Principles (Adapted from AVA OLO Framework)

### 1. LLM-First Development
All features must be designed for LLM interaction from the ground up. Every interface, API, and process should prioritize machine-readable formats and clear, structured communication.

### 2. Privacy-First Architecture
User data protection is non-negotiable. All systems must implement end-to-end encryption, minimal data retention, and clear user consent mechanisms.

### 3. Module Independence
Each module must function independently with no cross-dependencies. A failure in one module must never cascade to others.

### 4. Error Isolation
Errors must be contained within their originating module. Each module must have comprehensive error handling and recovery mechanisms.

### 5. Version Visibility
Every component must clearly display its version number. Version mismatches must be detected and reported immediately.

### 6. Deployment Protection
No deployment without protection gates. Every production push must pass through pre-deployment verification and have rollback capabilities.

### 7. Change Tracking
Every change must be logged in SYSTEM_CHANGELOG.md with dual timestamps (UTC | CET), change type, and impact assessment.

### 8. Zero Regression Tolerance
Once a feature works, it must continue working. Any regression is a critical failure requiring immediate attention.

### 9. Test Coverage & Universal Design (MANGO RULE)
Every feature must have comprehensive tests. The MANGO TEST for Ch: "Any feature in Ch project works for any use case in any country."

**CLARIFICATION**: The MANGO RULE ensures true universality. It means:
- **No assumptions** about "normal" products, languages, or markets
- **Equal excellence** for common cases (English/standard products) AND edge cases (Bulgarian/exotic products)
- **Script independence** - works with Latin, Cyrillic, Arabic, Chinese characters
- **Cultural awareness** without hardcoded biases
The "Bulgarian mango business" test reminds us that unexpected combinations are equal users.
See `/essentials/MANGO_RULE_CLARIFICATION.md` for full explanation.

### 10. Documentation Standards
All code must be self-documenting. Complex logic requires clear explanations. Task Specifications (TS) drive all development.

### 11. Performance Monitoring
Every component must have performance metrics. Degradation must trigger alerts before user impact.

### 12. Security by Design
Security cannot be an afterthought. Every feature must undergo security review before implementation.

### 13. Scalability Planning
Design for 10x current load. Every architectural decision must consider future growth.

### 14. User Experience Excellence
Every interaction must be intuitive. Complexity must be hidden behind simple interfaces.

### 15. Continuous Improvement
Regular reviews, updates, and optimizations. The system must evolve with user needs and technological advances.

## Implementation Mandate

These principles are not suggestions - they are requirements. Every line of code, every design decision, and every deployment must align with these principles.

**The MANGO RULE for Ch**: Any feature must work for any use case in any country, maintaining consistency and reliability across all contexts. This means equal support for both expected scenarios (English speakers using standard products) and unexpected ones (Bulgarian businesses dealing with exotic products in Cyrillic script).