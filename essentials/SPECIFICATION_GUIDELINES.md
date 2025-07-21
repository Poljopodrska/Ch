# Ch Project Specification Guidelines

## Communication Protocol for Web-based Claude

### Clarification Process
When receiving instructions, web-based Claude should:

1. **Evaluate Understanding**: For every instruction, determine if clarification is needed
2. **Ask Numbered Questions**: If clarification is required, ask numbered questions:
   - **1.** [First question]
   - **2.** [Second question]
   - etc.

3. **Use Lettered Options** (preferred): When possible, provide multiple choice answers:
   - **Question 1:** Which module structure should we implement?
     - **a)** Separate pricing and planning modules
     - **b)** Integrated production planning module
     - **c)** Modular component-based approach

4. **Avoid Unnecessary Questions**: If the instruction is clear, proceed without inventing questions

### Task Assignment Priority

**ABSOLUTE PRIORITY: Claude Code (c.code)**
- Before starting any task, Claude should determine: "Can Claude Code handle this?"
- If YES → **c.code has absolute priority**
- Claude Code is capable of:
  - TypeScript/JavaScript development
  - File manipulation and code generation
  - Module development and bundling
  - Testing and deployment verification
  - Git operations and version control
  - CSS/HTML modifications
  - API development and integration

**FALLBACK: Human**
- Only assign tasks to human when c.code genuinely cannot handle them
- Examples of human-only tasks:
  - Business logic decisions requiring domain expertise
  - External service integrations requiring manual setup
  - Design decisions requiring user input
  - Hardware configurations

### Communication Flow
1. Receive instruction
2. Ask clarifying questions (if needed, using numbered/lettered format)
3. Determine if c.code can handle the task
4. If YES: Assign to c.code with clear specification
5. If NO: Document why and assign to human

---

## Standard Abbreviations Vocabulary

**Essential abbreviations for all communication:**

**TS** = **TASK SPECIFICATION FOR CLAUDE CODE**
- When you see "TS" or "ts" anywhere, it means "TASK SPECIFICATION FOR CLAUDE CODE"
- These specifications follow the template below for Claude Code to implement

**CC** = **CLAUDE CODE**  
- When you see "CC" or "cc" anywhere, it means "Claude Code"
- The CLI-based coding assistant with absolute task priority
- Example: "CC should handle this module development task"

*Both web-based Claude and Claude Code must recognize these abbreviations*

---

## The 5-Step Recipe for Perfect Specifications

### 1. CONTEXT
- What exists now?
- What problem are we solving?
- Who are the users?
- What constraints exist?

### 2. GOAL
- What does success look like?
- What specific outcome do we want?
- How will users benefit?

### 3. SUCCESS CRITERIA
- Measurable outcomes
- Specific functionality requirements
- Performance benchmarks
- User experience targets

### 4. REQUIREMENTS
- Technical specifications
- Integration needs
- Security requirements
- Compliance needs

### 5. IMPLEMENTATION APPROACH
- High-level architecture
- Key components
- Integration points
- Deployment strategy

## TS (Task Specification) Template

```markdown
# TS - TASK SPECIFICATION FOR CLAUDE CODE

## FEATURE: [Clear, concise feature name]

## MANGO TEST: [How this feature works universally]

## GOAL:
[1-2 sentences describing the desired outcome]

## SUCCESS CRITERIA:
- [ ] Specific, measurable outcome 1
- [ ] Specific, measurable outcome 2
- [ ] Specific, measurable outcome 3

## REQUIREMENTS:
- **Functional**: What it must do
- **Technical**: How it must work
- **Performance**: Speed/scale requirements
- **Security**: Protection requirements

## CONTEXT:
- **Current State**: What exists now
- **Problem**: What needs solving
- **Users**: Who will use this
- **Constraints**: Limitations to consider

## IMPLEMENTATION APPROACH:
1. High-level step 1
2. High-level step 2
3. High-level step 3

## NOTES:
- Additional considerations
- Edge cases to handle
- Future expansion possibilities
```

## Writing Effective Specifications

### DO:
- Be specific and measurable
- Include examples
- Define edge cases
- Specify error handling
- Consider scalability
- Think about maintenance

### DON'T:
- Use ambiguous language
- Skip success criteria
- Ignore error cases
- Forget about users
- Assume context
- Mix implementation with specification

## Success Criteria Best Practices

### Good Success Criteria:
- ✅ "Response time under 200ms for 95% of requests"
- ✅ "Supports 1000 concurrent users"
- ✅ "Zero data loss during failover"
- ✅ "Works offline with full functionality"

### Poor Success Criteria:
- ❌ "Fast performance"
- ❌ "Good user experience"
- ❌ "Reliable system"
- ❌ "Secure implementation"

## The MANGO TEST

Every specification must include how the feature passes the MANGO TEST:
"Any feature in Ch project works for any use case in any country"

Consider:
- Language support
- Cultural differences
- Legal requirements
- Network conditions
- Device capabilities
- Accessibility needs

## Specification Review Checklist

Before finalizing a specification:

- [ ] Goal is clear and achievable
- [ ] Success criteria are measurable
- [ ] Requirements are complete
- [ ] Edge cases are documented
- [ ] MANGO TEST is addressed
- [ ] Implementation approach is logical
- [ ] Dependencies are identified
- [ ] Risks are acknowledged

## Common Specification Mistakes

1. **Too Vague**: "Make it better" → "Reduce load time from 3s to under 1s"
2. **Too Technical**: Jumping to implementation details
3. **Missing Context**: Not explaining why
4. **No Success Metrics**: How do we know when we're done?
5. **Ignoring Users**: Not considering actual usage
6. **Forgetting Edge Cases**: Only happy path thinking

## Specification Lifecycle

1. **Draft**: Initial specification creation
2. **Review**: Team/stakeholder feedback
3. **Refine**: Incorporate feedback
4. **Approve**: Final sign-off
5. **Implement**: Development begins
6. **Verify**: Check against success criteria
7. **Document**: Update based on implementation

## Emergency Specification Process

For urgent fixes:
1. Document the emergency
2. Define minimum viable fix
3. Create abbreviated TS
4. Implement with extra testing
5. Create full specification afterward
6. Review and improve

## Remember

- Specifications drive implementation, not vice versa
- A good specification saves 10x the time in development
- When in doubt, be more specific
- Always consider the MANGO TEST
- User needs come first