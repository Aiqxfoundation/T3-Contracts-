// SPDX-License-Identifier: MIT pragma solidity ^0.5.10;

/* ────────────────────────────────────────────────────────────── USDT — Lightweight TRC20 Token (Optimized) Features: Trading toggle, metadata update, low energy use. ────────────────────────────────────────────────────────────── */

library SafeMath { function add(uint256 a, uint256 b) internal pure returns (uint256) { uint256 c = a + b; require(c >= a, "Addition overflow"); return c; }

function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a, "Subtraction underflow");
    return a - b;
}

}

contract USDT { using SafeMath for uint256;

string public name;
string public symbol;
uint8 public decimals;
uint256 public totalSupply;
address public owner;
bool public tradingEnabled = true;

string public metadataURI;
string public logoURL;
string public website;

mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;

event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed tokenOwner, address indexed spender, uint256 value);
event TradingStatusChanged(bool enabled);
event MetadataUpdated(string name, string symbol, string metadataURI, string logoURL, string website);

modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

modifier canTrade(address _from) {
    require(tradingEnabled || _from == owner, "Trading disabled");
    _;
}

constructor(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    uint256 _initialSupply
) public {
    owner = msg.sender;
    name = _name;
    symbol = _symbol;
    decimals = _decimals;

    uint256 supply = _initialSupply * (10 ** uint256(_decimals));
    totalSupply = supply;
    balanceOf[owner] = supply;

    emit Transfer(address(0), owner, supply);
}

function transfer(address _to, uint256 _value) public canTrade(msg.sender) returns (bool) {
    require(_to != address(0), "Invalid address");
    require(balanceOf[msg.sender] >= _value, "Insufficient balance");

    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);

    emit Transfer(msg.sender, _to, _value);
    return true;
}

function approve(address _spender, uint256 _value) public returns (bool) {
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
}

function transferFrom(address _from, address _to, uint256 _value) public canTrade(_from) returns (bool) {
    require(_to != address(0), "Invalid address");
    require(balanceOf[_from] >= _value, "Insufficient balance");
    require(allowance[_from][msg.sender] >= _value, "Not approved");

    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    balanceOf[_from] = balanceOf[_from].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);

    emit Transfer(_from, _to, _value);
    return true;
}

function setTradingStatus(bool _status) external onlyOwner {
    tradingEnabled = _status;
    emit TradingStatusChanged(_status);
}

function updateMetadata(
    string memory _name,
    string memory _symbol,
    string memory _metadataURI,
    string memory _logoURL,
    string memory _website
) external onlyOwner {
    name = _name;
    symbol = _symbol;
    metadataURI = _metadataURI;
    logoURL = _logoURL;
    website = _website;

    emit MetadataUpdated(_name, _symbol, _metadataURI, _logoURL, _website);
}

function mint(uint256 _amount) external onlyOwner {
    uint256 scaled = _amount * (10 ** uint256(decimals));
    totalSupply = totalSupply.add(scaled);
    balanceOf[owner] = balanceOf[owner].add(scaled);
    emit Transfer(address(0), owner, scaled);
}

function burn(uint256 _amount) external onlyOwner {
    uint256 scaled = _amount * (10 ** uint256(decimals));
    require(balanceOf[owner] >= scaled, "Not enough balance");

    balanceOf[owner] = balanceOf[owner].sub(scaled);
    totalSupply = totalSupply.sub(scaled);
    emit Transfer(owner, address(0), scaled);
}

}

