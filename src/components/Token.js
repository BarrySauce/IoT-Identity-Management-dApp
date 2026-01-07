import React, { Component } from 'react';
import Web3 from 'web3';
import './Token.css';
import Popup from 'reactjs-popup';
import NFTContract from '../abis/NFTContract.json'

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Input,
  makeStyles,
  Typography
} from '@material-ui/core';
import { Field, FieldArray, Form, Formik } from 'formik';
import { CheckboxWithLabel, TextField } from 'formik-material-ui';
import { array, boolean, number, object, string, ValidationError } from 'yup';

const { create } = require('ipfs-http-client')
const ipfs = create('/ip4/127.0.0.1/tcp/5001')

//const emptyMint = { deviceID: '', deviceHash: '' };


class Token extends Component {
  //componentWillMount function is activated once the class App extends Component is run, then its inner function loadWeb3 will run to connect to MetaMask
  async componentWillMount () {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum){
      await window.ethereum.enable()
      window.web3 = new Web3(window.ethereum)
    }
    else if(window.web3){
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else{
      window.alert('Non-Ethereum browser detected. Please login to MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    const networkId = await web3.eth.net.getId()
    const networkData = NFTContract.networks[networkId]
    if(networkData) {
      const abi = NFTContract.abi
      const address = networkData.address
      const contract = new web3.eth.Contract(abi, address)
      this.setState({ contract })
      //const totalSupply = await contract.methods.totalSupply().call()
      const total = await contract.methods.getTokenCount().call()
      const totalSupply = total.toNumber()
      this.setState({ totalSupply })
      console.log('total amount of device tokens')
      console.log(totalSupply) // convert totalSupply data from bigNumber format to integer format
      for(var i = 1; i<=totalSupply; i++){
        const device = await contract.methods.device(i-1).call()
        const ownerID = await contract.methods.ownerID(device).call()
        const ownerProfileHash = await contract.methods.ownerProfileHash(device).call()
        const deviceProfileHash = await contract.methods.deviceProfileHash(device).call()
        this.setState({
          devices: [...this.state.devices, device],
          ownerIDs: [...this.state.ownerIDs, ownerID],
          ownerProfileHashes: [...this.state.ownerProfileHashes, ownerProfileHash],
          deviceProfileHashes: [...this.state.deviceProfileHashes, deviceProfileHash]
        })
      }
    } else{
      window.alert('Smart contract not deployed to the network')
    }
  }


  mint = (ownerID, device, deviceProfileHash) => {
    this.state.contract.methods.mint(device, ownerID, deviceProfileHash).send({from: this.state.account })
    .once('receipt', (receipt) =>{
      for(var i = 0; i< device.length; i++){
        this.setState({
          devices: [...this.state.devices, ...device[i]],
          ownerIDs: [...this.state.ownerIDs, ownerID],
          deviceProfileHashes: [...this.state.deviceProfileHashes, ...deviceProfileHash[i]],
          ownerProfileHashes: [...this.state.ownerProfileHashes, this.state.contract.methods.getUserProfileHash(ownerID).call({from: this.state.account })]
        })
      }
    })
  }

  captureFile = (event) => {
    //prevent a browser reload/refresh
    event.preventDefault()
    console.log('file captured')
    //process file for IPFS
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }



  fileSubmit = async (event) => {
    event.preventDefault()
    console.log("submitting form")
    const added = await ipfs.add(this.state.buffer)
    const myHash = added[Object.keys(added)[0]]
    console.log('Hash: ', myHash)
    this.setState( {hash: myHash} )
    this.setState({
      hashes: [...this.state.hashes, myHash]
    })
    console.log(this.state.hashes)
    console.log(this.state.hash)
    //var filelink = "https://ipfs.io/ipfs/" + this.state.hash;
    //console.log(filelink)
    //this.setState({link: filelink})
    //console.log(this.state.link)
  }




  transfer = (key, device, receiverID) => {
    this.state.contract.methods.transferToken(key, device, receiverID).send({from: this.state.account })
    .once('receipt', (receipt) =>{
      this.setState({
        ownerIDs: [this.state.ownerIDs[key], receiverID],
        ownerProfileHashes: [this.state.ownerProfileHashes[key], this.state.contract.methods.getUserProfileHash(receiverID).call({from: this.state.account })]
      })
    })
  }

  update = (key, device, newDeviceProfile) => {
    this.state.contract.methods.updateDeviceProfile(device, newDeviceProfile).send({from: this.state.account})
    .once('receipt', (receipt) =>{
      this.setState({
        deviceProfileHashes: [this.state.deviceProfileHashes[key], newDeviceProfile]
      })
    })
  }

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      contract: null,
      totalSupply: 0,
      devices: [],
      ownerIDs: [],
      ownerProfileHashes: [],
      userProfileHashes: [],
      deviceProfileHashes: [],
      buffer: null,
      hashes: [],
      hash:''
    }
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-light fixed-top flex-md-nowrap p-0 shadow" style={{ backgroundColor: '#FFFFFF'}}>
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            IoT Device Token Amount: {this.state.totalSupply}
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className = "text-black"><span id="account">Current User:  {this.state.account}</span></small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>IoT Device Token Manager</h1>
                <Card>
                <CardContent>
                <Formik
                  initialValues={{
                    OwnerID: '',
                    devices: [],
                    deviceHashes:[]
                  }}

                  onSubmit={(values, event) => {
                    this.mint(values.OwnerID, values.devices, this.state.hashes);
                    console.log(values.OwnerID);
                    console.log(values.devices);
                    console.log(values.deviceHashes);
                    console.log(this.state.hashes);
                    console.log(this.state.deviceProfileHashes);
                    console.log(this.state.devices);

                    }
                  }
                  render={({ values }) => (
                    <Form autoComplete="off">
                      <Grid item>
                        <Field
                          fullWidth
                          name="OwnerID"
                          component={TextField}
                          label="Owner ID"
                        />
                      </Grid>
                      <br></br>
                      <FieldArray
                        name="devices"
                        render={arrayHelpers => (
                          <div>
                          <Grid item>
                            <Typography variant="body1">
                              Device token to be minted
                            </Typography>
                          </Grid>
                            {values.devices && values.devices.length > 0 ? (

                              values.devices.map((device, index) => (
                                <Grid
                                 container
                                 item
                                 key={index}
                                 spacing={2}
                                 >
                                  <Field
                                    fullWidth
                                    name={`devices.${index}`}
                                    component={TextField}
                                    label="Device ID"
                                  />
                                  <Grid>
                                    <br></br>
                                    <br></br>
                                  </Grid>



                                  <Grid>
                                    Please choose device identity profile,
                                    <Grid>
                                      Device identity profile hash:
                                    </Grid>
                                    <br></br>
                                    <Grid>
                                      {this.state.hashes[index]}
                                    </Grid>
                                    <br></br>
                                    <br></br>

                                    <Input type='file'  onChange={this.captureFile} />

                                    <Button
                                    type = 'button'
                                    style={{ backgroundColor: '#87CEEB'}}
                                    onClick={this.fileSubmit}>
                                      submit
                                    </Button>

                                  </Grid>



                                  <Button
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)} // remove a friend from the list
                                  >
                                    Remove
                                  </Button>
                                </Grid>
                              ))
                            ) : (
                              <div>
                                {/* show this when user has removed all friends from the list */}
                              </div>
                            )}
                            <div>
                              <br></br>
                              <Grid item>
                                <Button
                                  type="button" onClick={() => arrayHelpers.push('')}
                                  style={{ backgroundColor: '#87CEEB'}}
                                >
                                  Add a device ID
                                </Button>
                              </Grid>
                              <br></br>
                              <Grid item>
                              <Button type="submit"
                               style={{ backgroundColor: '#87CEEB'}}>
                               Mint
                              </Button>
                              </Grid>
                            </div>

                          </div>
                        )}

                      />
                    </Form>
                  )}
                />
              </CardContent>
              </Card>
              </div>
            </main>
          </div>
          <hr/>
          <br></br>
          <div className="row text-center">
          { this.state.devices.map((device, key) => {
            return(
              <div key={key} className="col-md-4 mb-6">
              <Popup
                trigger={
                  <button
                    type="submit"
                    style={{ backgroundColor: '#FFFFFF'}}>
                    <div>Device ID: {device}</div>
                    <div>Owner ID: {this.state.ownerIDs[key]}</div>
                    <div>Owner Identity Profile Hash:
                      <br></br>
                      {this.state.ownerProfileHashes[key]}
                    </div>
                    <div>Device Identity Profile Hash:
                      <br></br>
                      {this.state.deviceProfileHashes[key]}
                    </div>
                  </button>
                }
                modal
                nested
              >
                {close => (
                  <div className="modal">
                    <button className="close" onClick={close}>
                      &times;
                    </button>
                    <div className="header"> Transfer Token </div>
                    <div className="content">
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        const receiverID = this.receiverID.value
                        this.transfer(key, device, receiverID)
                      }}>
                        <label>
                          Transfer to:
                          <input
                            type="text"
                            name="name"
                            placeholder='please input recepient ID'
                            ref = {(input) => {this.receiverID = input }}
                          />
                        </label>
                        <input
                          type='submit'
                          className='btn btn-block'
                          style={{ backgroundColor: '#87CEEB'}}
                          value='Transfer'
                        />


                      </form>
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        this.update(key, device, this.state.hash)
                      }}>
                      <label>
                        Updated Device Identity Profile Hash:
                      </label>
                        <br></br>
                        <div>
                          {this.state.hash}
                        </div>
                      <input type='file'  onChange={this.captureFile} />

                      <button
                      type = 'button'
                      style={{ backgroundColor: '#87CEEB'}}
                      onClick={this.fileSubmit}>
                        submit
                      </button>
                      <input
                        type='submit'
                        className='btn btn-block'
                        style={{ backgroundColor: '#87CEEB'}}
                        value='Update'
                      />
                      </form>
                    </div>
                  </div>
                )}
              </Popup>
              <p>
                <br></br>
                <br></br>
              </p>
              </div>

            )
          })}
          </div>
        </div>
      </div>
    );
  }
}

export default Token;
