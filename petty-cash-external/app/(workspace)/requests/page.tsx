import Link from 'next/link';
import { branchLabel, money } from '../../../lib/expenses';
import { requireProfile } from '../../../lib/session';
import { store } from '../../../lib/store';
import { ActionForm } from '../../action-form';
import { submitAnswer } from '../../actions';

export default async function Requests({ searchParams }: { searchParams: Promise<{ saved?: string; answered?: string; status?: string }> }) {
  const profile = await requireProfile();
  const { saved, answered, status } = await searchParams;
  const [requests, questions] = await Promise.all([store().listRequests(profile.id), store().listClarifications(profile)]);
  const savedRequest = requests.find(request => request.id === saved);
  const rows = ['Pending', 'Approved', 'Rejected'].includes(status ?? '') ? requests.filter(row => row.status === status) : requests;
  const open = questions.flatMap(question => {
    const row = requests.find(request => request.id === question.requestId);
    return row ? [{ ...question, title: row.title }] : [];
  });
  return (
    <>
      <div className="page-heading">
        <div><h1>My requests</h1><p className="lede">Track the expenses you’ve submitted.</p></div>
        <Link className="button" href="/requests/new">New request</Link>
      </div>
      {savedRequest && <p className="feedback success" role="status">Request {savedRequest.title} was saved.</p>}
      {answered === '1' && <p className="feedback success" role="status">Your reply was submitted.</p>}
      {open.length > 0 && <section className="panel section-panel discussion" aria-labelledby="questions-title">
        <h2 id="questions-title">Questions from reviewers</h2>
        {open.map(question => <article className="space-top" key={question.id}>
          <h3>{question.title}</h3><p className="question">{question.question}</p>
          <ActionForm action={submitAnswer} label="Send reply" saving="Sending…">
            <input type="hidden" name="questionId" value={question.id} />
            <label>Your answer<textarea name="answer" maxLength={4000} rows={3} required /></label>
          </ActionForm>
        </article>)}
      </section>}
      <form className="filter-bar" method="get">
        <label>Approval status<select name="status" defaultValue={status ?? ''}>
          <option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option>
        </select></label>
        <button type="submit" className="secondary">Filter</button>
      </form>
      <section className="panel request-history" aria-label="Request history">
        {rows.length === 0 ? (
          <div className="empty"><h2>No requests yet</h2><p>Your submitted requests will appear here.</p></div>
        ) : (
          <div className="table-overflow">
            <table>
              <thead><tr><th>Request</th><th>Expense date</th><th>Branch</th><th className="amount">Amount</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>{rows.map(request => (
                <tr key={request.id}>
                  <th scope="row">{request.title}<span className="description">{request.purpose}</span>
                    {request.comment && <span className="description">Reviewer: {request.comment}</span>}</th>
                  <td>{request.date}</td><td>{branchLabel(request.branch)}</td>
                  <td className="amount">{money(request.total)}</td>
                  <td><span className={'badge ' + request.status.toLowerCase()}>{request.status}</span></td>
                  <td><a href={'/api/requests/' + request.id + '/receipt'}>PDF</a></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
