# ScopeDiff AI – Change Labels

## `paraphrase`
The wording changes while the business meaning remains the same.

## `numeric_change`
A number, limit, count, percentage, or threshold changes.

## `duration_change`
A time value or time constraint changes.

## `modality_change`
The obligation level changes, such as `must` becoming `may`.

## `negation_change`
A positive rule becomes negative or a negative rule becomes positive.

## `condition_change`
A condition is added, removed, or modified.

## `scope_change`
The affected customer, user, product, or process group changes.

## `actor_change`
The actor or authorized role changes.

## `state_change`
A process or entity state changes.

## `requirement_added`
A new requirement is introduced in the newer version.

## `requirement_removed`
An existing requirement is absent from the newer version.

## Recommended Risk Mapping

| Change label | Default risk |
|---|---|
| paraphrase | Low |
| condition_change | Medium |
| scope_change | Medium |
| actor_change | Medium / High |
| numeric_change | High |
| duration_change | High |
| modality_change | High |
| negation_change | High |
| state_change | High |
| requirement_added | Medium |
| requirement_removed | High |
