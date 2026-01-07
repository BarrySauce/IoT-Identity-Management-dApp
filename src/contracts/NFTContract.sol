pragma solidity >=0.6.0 <=0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTContract is ERC1155, Ownable {

    string[] public device;
    mapping(string => bool) _deviceExists; // string would be key, and bool would be value, the value varaible name is _deviceExists
    mapping(string => address) public ownerAddress;      //maps device of owner's address
    mapping(string => string) public ownerID;            //maps device to ownerID
    mapping(string => string) public ownerProfileHash;        //maps device to owner profileHash
    mapping(string => string) public deviceProfileHash; //maps device to device profileHash

    string[] public user;
    mapping(string => bool) _userExists;
    mapping(string => address) public userAddress;       //maps userID to  user address
    mapping(string => string) public userProfileHash;    //maps userID to user profile hash

    //uint256[] ids;
    //uint256[] amounts;


    constructor() ERC1155("https://game.example/api/item/{id}.json") {

    }

// create user part, centralized way, only minter can create user accounts
    function createUser(
      string memory _user,
      address _userAddress,
      string memory _userProfileHash) public onlyOwner {
        require(!_userExists[_user], "This user has already been created");
        user.push(_user);
        _userExists[_user] = true;

        userAddress[_user] = _userAddress;
        userProfileHash[_user] = _userProfileHash;

      }


    function getUserCount() public view returns(uint256 count) {
      return user.length;
    }


//token mint and transfer part, centralized way, only minter can mint device tokens
    function mint(
      string[] memory _device,
      string memory _ownerID,
      string[] memory _deviceProfileHash) public onlyOwner {
      require(_device.length > 0, "Please input device id ");
      uint256[] memory _ids = new uint256[](_device.length);
      uint256[] memory _amounts = new uint256[](_device.length);
      for (uint i=0; i<_device.length; i++) {
           require(!_deviceExists[_device[i]], "Token for this device has already been minted");
           device.push(_device[i]);
           uint _id = device.length - 1;

           _ids[i] = _id;
           _deviceExists[_device[i]] = true;

           _amounts[i] = 1;

           ownerAddress[_device[i]] = userAddress[_ownerID];
           ownerID[_device[i]] = _ownerID;
           ownerProfileHash[_device[i]] = userProfileHash[_ownerID];
           deviceProfileHash[_device[i]] = _deviceProfileHash[i];
      }

      _mintBatch(userAddress[_ownerID], _ids, _amounts, '');
    }


    function transferToken(
      uint256 id,
      string memory _device,
      string memory _ownerID) public {
      safeTransferFrom(msg.sender, userAddress[_ownerID], id, 1, '');
      ownerID[_device] = _ownerID;
      ownerAddress[_device] = userAddress[_ownerID];
      ownerProfileHash[_device] = userProfileHash[_ownerID];
    }


    function getTokenCount() public view returns(uint256 count) {
      return device.length;
    }

    function getUserProfileHash(string memory _userID) public view returns(string memory hash) {
      return userProfileHash[_userID];
    }

    function updateDeviceProfile(
      string memory _device,
      string memory _newDeviceProfileHash) public {
        require (msg.sender == ownerAddress[_device]);
        deviceProfileHash[_device] = _newDeviceProfileHash;
      }



    /*function transOwner(address _ownerAddress, string memory _device, string memory _ownerID2, string memory _profileHash) public onlyOwner{
      //address _ownerAddress = ownerAddress[_ownerID2];
      //ownerID[] = '';
      //profileHash[owner] = '';
      transferOwnership(_ownerAddress);
      ownerID[_device] = _ownerID2;
      profileHash[_device] = _profileHash;
    }

    function getOwnerID(string memory _device) public view returns(string ownerID) {
      return ownerID[_device];
    }

    function getProfileHash(string memory _device) public view returns(string profileHash) {
      return profile[_device];
    }*/

}
