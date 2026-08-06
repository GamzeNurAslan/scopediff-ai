# ScopeDiff AI – Project Scope

## Purpose

ScopeDiff AI is an AI-assisted analysis and decision-support system designed to compare different versions of design and requirement documents.

The system aims to help analysts and developers understand what changed between document versions and identify changes that may be related to reported defects.

## Main Features

- Semantic matching of requirements between versions
- Detection of added and removed requirements
- Detection of numeric, duration, condition, scope, obligation, and negation changes
- Change risk scoring
- Requirement version history
- Defect-related change ranking
- Dashboard and detailed comparison views
- Excel report generation

## Inputs

- Previous requirement document
- New requirement document
- Optional defect description

## Outputs

- Matched old and new requirements
- Change type
- Risk level
- Similarity and confidence scores
- Change explanation
- Related defect score
- Suggested analyst questions
- Suggested test scenarios

## Data Privacy

The project will use only synthetic data.

It will not contain real customer data, confidential company documents, internal APIs, or proprietary business information.

## Project Limitation

The defect analysis module will not claim to find the exact root cause. It will rank the document changes that should be investigated first.