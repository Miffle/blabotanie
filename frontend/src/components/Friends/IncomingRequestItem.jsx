export default function IncomingRequestItem({ request, onAccept, onDecline }) {
    return (
      <div className="friend-item">
        <span>{request.senderUsername}</span>
        <button onClick={() => onAccept(request.id)}><i className="fa fa-check" aria-hidden="true"></i></button>
        <button onClick={() => onDecline(request.id)}><i className="fa fa-ban" aria-hidden="true"></i></button>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
         </div>
    );
  }
  