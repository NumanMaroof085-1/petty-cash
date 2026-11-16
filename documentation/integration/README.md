# Business Central source table reference

[Petty Cash Tables for Business Central.docx](<Petty Cash Tables for Business Central.docx>)
contains only the two requested table definitions: Petty Cash Request and Petty
Cash Line Item. It lists the 18 request columns and nine line-item columns used
by the current project, with logical names, data types and purposes. Configured
choice codes and all 23 saved unit values are included for mapping.

This is a source-column dictionary, not an implemented Business Central export
or a proposed target-field mapping. The transaction date's native Date Only /
User Local behavior requires metadata confirmation; its current application
usage is documented. Other tables are mentioned only as lookup targets.

Regenerate from the project root with the bundled Python runtime:

```powershell
python scripts/build_bc_table_reference.py
```

The generator verifies application-column coverage and reads the current choice
and unit mappings from the request script. Render and inspect the newly generated
DOCX before distributing a changed copy. QA intermediates are under
documentation/qa/business-central-tables and are not the handover document.
