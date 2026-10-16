# Canonical relationship migration

## Legacy cleanup completion

`20261016-remove-legacy-relations.js` removes only legacy fields whose canonical ObjectId relationships already exist. Run it dry by default with `npm run db:migrate:legacy-relations`, review its report, then apply with `npm run db:migrate:legacy-relations:apply`. Its rollback command restores the saved prior values.

Records without a complete canonical relationship are skipped and remain in the report for manual repair. After this cleanup has been applied, `20261004-canonical-relations.js` is historical migration evidence only and must not be re-run against the cleaned database.

`20261004-canonical-relations.js` is dry-run by default. It adds only safe canonical ObjectId references while retaining every legacy field and document.

## Apply process

1. Run `npm run db:migrate:relations` to generate a dry-run JSON report.
2. Review the report under `server/migration-reports/`. Entries in `issues` are not changed.
3. Run `npm run db:migrate:relations:apply` to apply only the reported changes within one MongoDB transaction.
4. Keep the report. Every change contains the prior field state and the applied value.

Run `npm run db:migrate:relation-indexes` next, then review its report before running `npm run db:migrate:relation-indexes:apply`. This separately replaces only the legacy non-unique indexes for canonical references. Its report includes the original index definition for rollback.

## Automatic migration rules

- A canonical reference is added only when its legacy string is a valid ObjectId and the target document exists.
- Duplicate Freelancer user IDs and duplicate Application `(projectId, freelancerId)` pairs are reported and not canonicalized. No document is deleted or selected as the winner.
- Null IDs, missing targets, stale reverse arrays, and unknown message senders are reported without mutation.
- Legacy IDs, bid arrays, and freelancer reverse arrays are retained during this stage for rollback and auditability.

## Rollback

Run `npm run db:rollback:relations -- migration-reports/<report-file>.json`. The rollback uses the saved prior field state and only reverts canonical fields written by the apply run. It never touches legacy fields or deletes documents.

For indexes, run `npm run db:rollback:relation-indexes -- migration-reports/<report-file>.json`.
