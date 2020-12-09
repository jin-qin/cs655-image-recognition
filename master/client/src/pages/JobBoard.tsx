import React, {useState, useEffect} from 'react';
import './JobBoard.css';
import { Button, Table, Badge, Modal} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import config from '../config/app-config.json';
import refresh_icon from '../assets/images/btn_refresh.svg';

function JobBoard() {
  const [isJobItemsLoading, setJobItemsLoading] = useState(true);
  const refreshJobTable = () => { setJobItemsLoading(true); }

  const [showAlertModal, setShowAlertModal] = useState(false);
  const setAlertModalVisible = (visible: boolean) => setShowAlertModal(visible);

  const [deleteJobParams, setDeleteJobParams] = useState({job_id:'', is_delete_all: false});

  const [jobResultWidgetData, setJobResultWidgetData] = useState<JobResultWidgetProps>({item: null, pos: {x:0, y:0}, show: false});

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
        <RefreshButton
          isJobItemsLoading={isJobItemsLoading}
          refreshJobTable={refreshJobTable}
        />
      </div>

      <JobBoardTable 
        isJobItemsLoading={isJobItemsLoading} 
        setJobItemsLoading={setJobItemsLoading}
        setAlertModalVisible={setAlertModalVisible}
        setDeleteJobParams={setDeleteJobParams}
        setJobResultWidgetData={setJobResultWidgetData}
      />
      
      <div className='JobBoard-Actions'>
        <LinkContainer to="/job_submit">
          <Button variant='primary' size='lg'>SUBMIT A NEW JOB</Button>
        </LinkContainer>

        <Button variant='danger' size='lg' onClick={tryDeleteAllItems}>DELETE ALL JOBS</Button>
      </div>

      <Modal show={showAlertModal} onHide={() => setAlertModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Please be careful to delete the job(s)! This operation cannot be recovered!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAlertModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <JobResultWidget 
        item={jobResultWidgetData.item}
        pos={jobResultWidgetData.pos}
        show={jobResultWidgetData.show}
      />
    </div>
  );
}

interface JobBoardTableProps {
  isJobItemsLoading: boolean,
  setJobItemsLoading: any,
  setAlertModalVisible: any,
  setDeleteJobParams: any,
  setJobResultWidgetData: any
}

interface JobBoardItemData {
  job_id:string;
  status:string;
  submit_time:string;
  schedule_time:string;
  finish_time:string;
  img_name:string;
  result:string;
  description:string
}

function JobBoardTable(props: JobBoardTableProps) {
  const { isJobItemsLoading, setJobItemsLoading, setAlertModalVisible, setDeleteJobParams, setJobResultWidgetData } = props;
  const [jobItems, setJobItems] = useState(null);
  
  useEffect(() => {
    const fetch_jobs_data = () => {
      fetch(`${config.app.server_addr}/jobs/all`)
      .then(res => res.json())
      .then((rsp) => {
        // first, sort data based on date time and job status
        // if statuses are same, sort by date time descendingly
        // otherwise, running jobs are first, then queued jobs, then finished jobs (success or error)
        const jobs = rsp.data.sort((n1: any, n2: any) => {
          if (n1['status'] === n2['status']) {
            const ts1 = Date.parse(n1['submit_time']);
            const ts2 = Date.parse(n2['submit_time']);
            return ts1 > ts2 ? -1 : (ts1 === ts2 ? 0 : 0);
          }

          if (n1['status'] === 'RUNNING') return -1;
          if (n1['status'] === 'ERROR' && n2['status'] !== 'RUNNING') return -1;
          if (n1['status'] === 'QUEUED' && n2['status'] === 'SUCCESS') return -1;
          
          return 1;
        });

        let item_count = 0;
        const items = jobs.map((item: JobBoardItemData) => {
          item_count++;
          return JobBoardTableItem({item_count, item, setAlertModalVisible, setDeleteJobParams, setJobResultWidgetData});
        });
        setJobItemsLoading(false);
        setJobItems(items);
      })
      .catch(e => {
        console.log(e);
        setJobItemsLoading(false);
      });
    };

    if (isJobItemsLoading)
      fetch_jobs_data();

    const interval = setTimeout(() => setJobItemsLoading(true), 2000);

    return () => clearInterval(interval);

  }, [isJobItemsLoading, setJobItemsLoading, setAlertModalVisible, setDeleteJobParams, setJobResultWidgetData]);

  return(
    <div className='JobBoard-Board'>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Job ID</th>
            <th>Status</th>
            <th>Submitted Time</th>
            <th>Schedule Time</th>
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
  item: JobBoardItemData,
  setAlertModalVisible: any,
  setDeleteJobParams: any,
  setJobResultWidgetData: any
}

function JobBoardTableItem(props: JobBoardTableItemProps) {
  const {item_count, item, setAlertModalVisible, setDeleteJobParams, setJobResultWidgetData} = props;

  const styleMap = new Map([
    ['QUEUED', 'info'],
    ['RUNNING', 'warning'],
    ['SUCCESS', 'success'],
    ['ERROR', 'danger'],
  ]);

  const tryDeleteItem = () => {
    setDeleteJobParams({job_id: item.job_id, is_delete_all: false});
    setAlertModalVisible(true);
  };

  const setShowJobResultWidget = (e: any, item: JobBoardItemData, show: boolean) => {
    console.log(e.clientX, e.clientY)
    setJobResultWidgetData({item: item, pos: {x: e.clientX, y: e.clientY}, show: show});
  };

  const options = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: false,
    timeZoneName:'short'
  };

  const localTime = (dt?: string, opt?: Intl.DateTimeFormatOptions | undefined) => {
    return dt ? (new Date(dt)).toLocaleString('en-US', opt) : dt;
  };
  
  const submit_time = localTime(item.submit_time, options);
  const schedule_time = localTime(item.schedule_time, options);
  const finish_time = localTime(item.finish_time, options);

  return (
    <tr key={item_count}>
      <td>{item_count}</td>
      <td className='JobBoard-Item-JobID' 
          onMouseMove = { (e) => setShowJobResultWidget(e, item, true) } 
          onMouseOut = { (e) => setShowJobResultWidget(e, item, false) }>
            {item.job_id}
      </td>
      <td><Badge variant={styleMap.get(item.status)}>{item.status}</Badge></td>
      <td>{submit_time}</td>
      <td>{schedule_time}</td>
      <td>{finish_time}</td>
      <td><Button variant='danger' size='sm' onClick = { () => tryDeleteItem() }>DELETE</Button></td>
    </tr>
  );
}

interface JobResultWidgetProps {
  item: JobBoardItemData | null,
  pos: {x: number, y: number},
  show: boolean
}
function JobResultWidget(props: JobResultWidgetProps) {
  const {item, pos, show} = props;
  return (
    <div className='JobBoard-JobResultWidget' style={ {left: `${pos.x}px`, top: `${pos.y - 50}px`, visibility: show ? 'visible' : 'hidden', opacity: show ? 1 : 0} }>
      <img alt='' src={`${config.app.server_addr}/imgs/${item?.img_name}`}></img>
      <p>{item?.description}</p>
    </div>
  );
}

interface RefreshButtonProps {
  isJobItemsLoading: boolean,
  refreshJobTable: any
}
function RefreshButton(props: RefreshButtonProps) {
  const {isJobItemsLoading, refreshJobTable} = props;

  const [isRefreshBtnSpin, setRefreshBtnSpin] = useState(false);

  return (
    <img
      alt='refresh'
      src={refresh_icon}
      className={isRefreshBtnSpin ? 'JobBoard-RefreshButton-spin' : 'JobBoard-RefreshButton'}
      onClick={ () => {
        refreshJobTable();
        
        // delay 1 second to stop the spin animation
        setRefreshBtnSpin(true);
        const timer = setInterval(() => {
          if (!isJobItemsLoading) {
            clearInterval(timer);
            setRefreshBtnSpin(false);
          }
        }, 1000);
      }}
    />
  );
}

export default JobBoard;
