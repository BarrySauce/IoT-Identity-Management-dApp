import React, { Component } from 'react';
import Web3 from 'web3';
import './User.css';
import NFTContract from '../abis/NFTContract.json'

const { create } = require('ipfs-http-client')
const ipfs = create('/ip4/127.0.0.1/tcp/5001')

class User extends Component {
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

      const totalHex = await contract.methods.getUserCount().call()
      const totalUser = totalHex.toNumber()
      this.setState({ totalUser })
      console.log('total number of users')
      console.log(totalUser) // convert totalSupply data from bigNumber format to integer format
      for(var i = 1; i<=totalUser; i++){
        const user = await contract.methods.user(i-1).call()
        const userAddress = await contract.methods.userAddress(user).call()
        const userProfileHash = await contract.methods.userProfileHash(user).call()
        this.setState({
          users: [...this.state.users, user],
          userAddresses: [...this.state.userAddresses, userAddress],
          userProfileHashes: [...this.state.userProfileHashes, userProfileHash]
        })
      }
    } else{
      window.alert('Smart contract not deployed to the network')
    }
  }


  create = (user, userAddress, userProfileHash) => {
    this.state.contract.methods.createUser(user, userAddress, userProfileHash).send({from: this.state.account })
    .once('receipt', (receipt) =>{
      this.setState({
        users: [...this.state.users, user],
        userAddresses: [...this.state.userAddresses, userAddress],
        userProfileHashes: [...this.state.userProfileHashes, userProfileHash]
      })
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
    this.setState({hash: myHash})
    console.log(this.state.hash)
    var filelink = "https://ipfs.io/ipfs/" + this.state.hash;
    console.log(filelink)
    this.setState({link: filelink})
    console.log(this.state.link)
  }



  constructor(props) {
    super(props);
    this.state = {
      account: '',
      contract: null,
      totalUser: 0,
      users: [],
      userAddresses: [],
      userProfileHashes: [],
      buffer: null,
      hash: '',
      link: ''
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
            Number of Users Registered: {this.state.totalUser}
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
                <h1>User Information Registration</h1>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const user = this.user.value
                  const userAddress = this.userAddress.value
                  this.create(user, userAddress, this.state.hash)
                }}>
                  <label>
                    User ID:
                    <input
                      type='text'
                      className = 'form-control mb-1'
                      placeholder=''
                      ref = {(input) => {this.user = input }}
                    />
                  </label>
                  <br></br>
                  <label>
                    User Address:
                    <input
                      type='text'
                      className = 'form-control mb-1'
                      placeholder=''
                      ref = {(input) => {this.userAddress = input }}
                    />
                  </label>
                  <br></br>
                  <label>
                    User Identity Profile Hash:
                  </label>
                    <br></br>
                    <div>
                      {this.state.hash}
                    </div>

                  <br></br>

                  <label>
                    Please choose user identity profile
                    <br></br>
                      <input type='file'  onChange={this.captureFile} />

                    <button onClick={this.fileSubmit}>
                      submit
                    </button>
                  </label>
                  <br></br>
                  <br></br>
                  <input
                    type='submit'
                    className='btn btn-block'
                    style={{ backgroundColor: '#FFFFFF'}}
                    value='Create'
                  />
                </form>
              </div>
            </main>
          </div>
          <hr/>
          <br></br>
          <div className="row text-center">
          { this.state.users.map((user, key) => {
            return(
              <div key={key} className="col-md-4">
                  <button
                    type="submit"
                    style={{ backgroundColor: '#FFFFFF'}}>
                    <div> User ID: {user}</div>
                    <div> Hash of User Identity Profile:
                      <br></br>
                        {this.state.userProfileHashes[key]}

                    </div>
                    <div> User Address:
                      <br></br>
                    {this.state.userAddresses[key]} </div>
                  </button>
                  <p>
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

export default User;
