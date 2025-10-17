// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TRC20Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        totalSupply = _initialSupply * (10 ** uint256(_decimals));
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "Invalid spender");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function mint(uint256 _amount) public onlyOwner returns (bool) {
        uint256 scaledAmount = _amount * (10 ** uint256(decimals));
        totalSupply += scaledAmount;
        balanceOf[owner] += scaledAmount;
        emit Mint(owner, scaledAmount);
        emit Transfer(address(0), owner, scaledAmount);
        return true;
    }
    
    function burn(uint256 _amount) public onlyOwner returns (bool) {
        uint256 scaledAmount = _amount * (10 ** uint256(decimals));
        require(balanceOf[owner] >= scaledAmount, "Insufficient balance");
        balanceOf[owner] -= scaledAmount;
        totalSupply -= scaledAmount;
        emit Burn(owner, scaledAmount);
        emit Transfer(owner, address(0), scaledAmount);
        return true;
    }
}
