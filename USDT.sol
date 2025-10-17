// SPDX-License-Identifier: MIT
pragma solidity ^0.5.10;

/*
 *  ──────────────────────────────────────────────────────────────
 *   USDT.sol — Educational TRC-20 Token Example (For Testing)
 *   Do NOT use for real financial purposes.
 *  ──────────────────────────────────────────────────────────────
 */

contract USDT {
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
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
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
        uint256 _initialSupply,
        string memory _metadataURI,
        string memory _logoURL,
        string memory _website
    ) public {
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        metadataURI = _metadataURI;
        logoURL = _logoURL;
        website = _website;

        totalSupply = _initialSupply * (10 ** uint256(_decimals));
        balanceOf[owner] = totalSupply;

        emit Transfer(address(0), owner, totalSupply);
    }

    function transfer(address _to, uint256 _value) public canTrade(msg.sender) returns (bool) {
        require(_to != address(0));
        require(balanceOf[msg.sender] >= _value);

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
        require(_to != address(0));
        require(balanceOf[_from] >= _value);
        require(allowance[_from][msg.sender] >= _value);

        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);

        emit Transfer(_from, _to, _value);
        return true;
    }

    function mint(uint256 _amount) public onlyOwner returns (bool) {
        uint256 scaledAmount = _amount * (10 ** uint256(decimals));
        totalSupply = totalSupply.add(scaledAmount);
        balanceOf[owner] = balanceOf[owner].add(scaledAmount);
        emit Mint(owner, scaledAmount);
        emit Transfer(address(0), owner, scaledAmount);
        return true;
    }

    function burn(uint256 _amount) public onlyOwner returns (bool) {
        uint256 scaledAmount = _amount * (10 ** uint256(decimals));
        require(balanceOf[owner] >= scaledAmount, "Not enough balance");
        balanceOf[owner] = balanceOf[owner].sub(scaledAmount);
        totalSupply = totalSupply.sub(scaledAmount);
        emit Burn(owner, scaledAmount);
        emit Transfer(owner, address(0), scaledAmount);
        return true;
    }

    function setTradingStatus(bool _status) public onlyOwner {
        tradingEnabled = _status;
        emit TradingStatusChanged(_status);
    }

    function updateMetadata(
        string memory _name,
        string memory _symbol,
        string memory _metadataURI,
        string memory _logoURL,
        string memory _website
    ) public onlyOwner {
        name = _name;
        symbol = _symbol;
        metadataURI = _metadataURI;
        logoURL = _logoURL;
        website = _website;
        emit MetadataUpdated(_name, _symbol, _metadataURI, _logoURL, _website);
    }
}

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b);
        return c;
    }
}
