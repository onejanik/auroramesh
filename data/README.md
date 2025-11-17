# Data & Analytics Workspace

- `migrations/postgres` – SQL Files für Kern-Schema (User, Content, Graph, Commerce).
- `migrations/dynamo` – JSON/YAML Definitionen für NoSQL Tabellen.
- `models/feature-store` – Feature Definitionen für Recommendation & Mood Feed.
- `pipelines/glue_jobs` – PySpark/Athena Jobs in Richtung Data Lake.
- `notebooks/experiments` – Research & Ranking Experimente.

## ToDo
1. `0001_init.sql` mit User/Profile Schema erstellen.
2. Dynamo Table Definition für `messages` + GSI (byConversation/byUser).
3. Feature Store Schema (Feast oder Custom) definieren.
4. Glue Job Template + IaC Einbindung (Terraform).
5. Data Governance Plan (Retention, PII Masking) dokumentieren.

