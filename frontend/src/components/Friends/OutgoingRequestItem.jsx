export default function OutgoingRequestItem({ request, onCancel }) {
    return (
      <div className="friend-item">
        <span>{request.recipientUsername}</span>
        <button onClick={() => onCancel(request.id)}><i className="fa fa-ban" aria-hidden="true"></i></button>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </div>
    );
  }
  