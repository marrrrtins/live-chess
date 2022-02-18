import React, { useState } from 'react'

function Modal({ children, onClose }) {
  const [open, setOpen] = useState(true)
  return open && (
    <div className='modal-container'>
      <div className='modal'>
        { children }
        <div className='modal-close' onClick={onClose}><i className='fa fa-times'></i></div>
      </div>
    </div>
  )
}

Modal.Header = function(props) {
  return (
    <div className='modal-header'>
      { props.children }
    </div>
  )
}

Modal.Body = function({ children }) {
  return (
    <div className='modal-body'>
      { children }
    </div>
  )
}

export default Modal