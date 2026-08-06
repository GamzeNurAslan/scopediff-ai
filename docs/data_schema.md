# ScopeDiff AI – Data Schema

## Requirement Documents

Each requirement document will contain the following fields:

| Field | Description |
|---|---|
| requirement_id | Unique identifier of the requirement |
| requirement_text | Requirement description |
| module | Related functional area |
| version | Document version |

## Defect Data

Defect samples will contain the following fields:

| Field | Description |
|---|---|
| defect_id | Unique identifier of the defect |
| defect_text | Description of the reported problem |
| expected_requirement_id | Requirement expected to be related to the defect |
| expected_version_change | Version transition expected to be related |

## Comparison Results

The system will generate the following fields:

| Field | Description |
|---|---|
| old_requirement_id | Requirement identifier in the previous version |
| new_requirement_id | Requirement identifier in the new version |
| old_requirement_text | Previous requirement text |
| new_requirement_text | New requirement text |
| match_status | Matched, added, removed, or changed |
| similarity_score | Semantic similarity score |
| change_type | Type of detected change |
| risk_level | Low, medium, or high |
| change_explanation | Explanation of the detected change |
| defect_relation_score | Similarity score between the defect and the change |
| confidence_score | Confidence level of the analysis |

## Change Types

- paraphrase
- numeric_change
- duration_change
- modality_change
- negation_change
- condition_change
- scope_change
- requirement_added
- requirement_removed

## Risk Levels

- Low: Wording or paraphrase changes
- Medium: Condition or scope changes
- High: Numeric, duration, obligation, negation, or removal changes