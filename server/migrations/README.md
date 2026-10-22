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

## Reapplication after rejection

The `20261017-application-active-index.js` migration changes the canonical application uniqueness rule so only `Pending` and `Accepted` applications participate in the unique `(project, freelancer)` index. Rejected applications remain as history and do not block a later bid.

`npm run db:migrate:application-active-index` is an offline dry-run: it does not load `MONGO_URI` or connect to MongoDB. It reports the desired index and the checks required before a change.

`npm run db:inspect:application-active-index` is read-only, but does connect to the configured database. It lists indexes using the `(project, freelancer)` key pair and audits duplicate active and all-status pairs. Use it only after explicitly confirming that `MONGO_URI` targets the intended database.

`npm run db:migrate:application-active-index:apply` first audits duplicate active pairs and will create the desired index only when no existing index uses those keys. It never drops or replaces an existing matching index; instead it refuses and requires a reviewed maintenance-window transition. This prevents a failed replacement from silently removing the only uniqueness protection.

The rollback command first refuses when any all-status duplicate pair exists, including rejected-history duplicates. It also refuses to replace an existing active-only index automatically, even when the data is otherwise valid, because MongoDB cannot guarantee an atomic index-definition replacement. Use a backup, pause writes, manually transition the index in a maintenance window, then run the read-only inspection again.

For a legacy-index transition, first take an Atlas backup and pause application writes. Run the read-only inspection and resolve every active duplicate it reports. Have a database administrator review the current `getIndexes()` output, then perform the following one-off operation in the intended database only during the maintenance window:

```javascript
db.applications.dropIndex('application_project_freelancer_unique')
db.applications.createIndex(
  { project: 1, freelancer: 1 },
  {
    name: 'application_project_freelancer_unique',
    unique: true,
    partialFilterExpression: {
      project: { $exists: true },
      freelancer: { $exists: true },
      status: { $in: ['Pending', 'Accepted'] },
    },
  },
)
```

Immediately run the read-only inspection again before resuming writes. The automated migration intentionally does not execute this destructive transition.
