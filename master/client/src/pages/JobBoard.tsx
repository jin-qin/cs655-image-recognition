import React, {useState, useEffect} from 'react';
import './JobBoard.css';

import { Button, Table, Badge, Modal} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import config from '../config/app-config.json';

function JobBoard() {
  const [isJobItemsLoading, setJobItemsLoading] = useState(true);
  const refreshJobTable = () => { setJobItemsLoading(true); }

  const [showAlertModal, setShowAlertModal] = useState(false);
  const setAlertModalVisible = (visible: boolean) => setShowAlertModal(visible);

  const [deleteJobParams, setDeleteJobParams] = useState({job_id:'', is_delete_all: false});

  const deleteItem = (jobID: string) => {
    fetch(`${config.app.server_addr}/jobs/del/${jobID}`, { method: 'DELETE' })
    .then(res => res.json())
    .then((rsp) => {
      if (rsp.result === 'success') {
        refreshJobTable();
      }
    });
  };

  const deleteAllItems = () => {
    fetch(`${config.app.server_addr}/jobs/clear`, { method: 'DELETE' })
    .then(res => res.json())
    .then((rsp) => {
      if (rsp.result === 'success') {
        refreshJobTable();
      }
    });
  };

  const tryDeleteAllItems = () => {
    setDeleteJobParams({job_id:'', is_delete_all:true});
    setAlertModalVisible(true);
  };

  const handleDelete = () => {
    setAlertModalVisible(false);
    
    if (deleteJobParams.is_delete_all) {
      deleteAllItems();
    } else {
      deleteItem(deleteJobParams.job_id);
    }
  };

  return (
    <div className='JobBoard-Layout'>
        <div className='JobBoard-Title'>
          <h1>Image Recognition System - Job Board</h1>
          <Button variant='primary' size='lg' onClick={refreshJobTable}>REFRESH</Button>
        </div>

        <JobBoardTable 
          isJobItemsLoading={isJobItemsLoading} 
          setJobItemsLoading={setJobItemsLoading}
          setAlertModalVisible={setAlertModalVisible}
          setDeleteJobParams={setDeleteJobParams}
        />
        
        <div className='JobBoard-Actions'>
          <LinkContainer to="/job_submit">
            <Button variant='primary' size='lg'>SUBMIT A NEW JOB</Button>
          </LinkContainer>

          <Button variant='danger' size='lg' onClick={tryDeleteAllItems}>DELETE ALL JOBS</Button>
        </div>

        <Modal show={showAlertModal} onHide={() => setAlertModalVisible(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Are you sure?</Modal.Title>
          </Modal.Header>
          <Modal.Body>Please be careful to delete the job(s)!</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setAlertModalVisible(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
    </div>
  );
}

interface JobBoardTableProps {
  isJobItemsLoading: Boolean;
  setJobItemsLoading: any;
  setAlertModalVisible: any
  setDeleteJobParams: any
}

function JobBoardTable(props: JobBoardTableProps) {
  const { isJobItemsLoading, setJobItemsLoading, setAlertModalVisible, setDeleteJobParams } = props;
  const [jobItems, setJobItems] = useState(null);

  useEffect(() => {
    if (!isJobItemsLoading) return;
    fetch(`${config.app.server_addr}/jobs/all`)
    .then(res => res.json())
    .then((rsp) => {
      let item_count = 0;
      const items = rsp.data.map((item: {job_id:string; status:string; submit_time:string; finish_time:string}) => {
        item_count++;
        return JobBoardTableItem({item_count, item, setAlertModalVisible, setDeleteJobParams});
      });
      setJobItemsLoading(false);
      setJobItems(items);
    });
  });

  return(
    <div className='JobBoard-Board'>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Job ID</th>
            <th>Status</th>
            <th>Submitted Time</th>
            <th>Finish Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {jobItems}
        </tbody>
      </Table>
    </div>
  );
}

interface JobBoardTableItemProps {
  item_count: number, 
  item: {
    job_id:string;
    status:string;
    submit_time:string;
    finish_time:string
  }, 
  setAlertModalVisible: any
  setDeleteJobParams: any
}

function JobBoardTableItem(props: JobBoardTableItemProps) {
  const {item_count, item, setAlertModalVisible, setDeleteJobParams} = props;

  const styleMap = new Map([
    ['QUEUED', 'info'],
    ['RUNNING', 'warning'],
    ['SUCCESS', 'success'],
    ['ERROR', 'danger'],
  ]);

  const tryDeleteItem = () => {
    setDeleteJobParams({job_id: item.job_id, is_delete_all: false});
    setAlertModalVisible(true);
  }

  return (
    <tr key={item_count}>
      <td>{item_count}</td>
      <td>{item.job_id}</td>
      <td><Badge variant={styleMap.get(item.status)}>{item.status}</Badge></td>
      <td>{item.submit_time}</td>
      <td>{item.finish_time}</td>
      <td><Button variant='danger' size='sm' onClick = { () => tryDeleteItem() }>DELETE</Button></td>
    </tr>
  );
}

export default JobBoard;