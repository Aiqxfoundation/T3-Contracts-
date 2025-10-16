// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TRC20Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public owner;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        totalSupply = _initialSupply * 10 ** uint256(_decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid recipient address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0), "Invalid spender address");
        // To prevent approval front-running, require allowance to be 0 before setting new value
        // Or use increaseAllowance/decreaseAllowance functions
        require(allowance[msg.sender][_spender] == 0 || _value == 0, 
            "Approve from non-zero to non-zero allowance not allowed. Use increaseAllowance or decreaseAllowance");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function increaseAllowance(address _spender, uint256 _addedValue) public returns (bool success) {
        require(_spender != address(0), "Invalid spender address");
        allowance[msg.sender][_spender] += _addedValue;
        emit Approval(msg.sender, _spender, allowance[msg.sender][_spender]);
        return true;
    }
    
    function decreaseAllowance(address _spender, uint256 _subtractedValue) public returns (bool success) {
        require(_spender != address(0), "Invalid spender address");
        require(allowance[msg.sender][_spender] >= _subtractedValue, "Decreased allowance below zero");
        allowance[msg.sender][_spender] -= _subtractedValue;
        emit Approval(msg.sender, _spender, allowance[msg.sender][_spender]);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid recipient address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function mint(uint256 _amount) public onlyOwner returns (bool success) {
        uint256 amount = _amount * 10 ** uint256(decimals);
        totalSupply += amount;
        balanceOf[owner] += amount;
        
        emit Mint(owner, amount);
        emit Transfer(address(0), owner, amount);
        return true;
    }
    
    function burn(uint256 _amount) public onlyOwner returns (bool success) {
        uint256 amount = _amount * 10 ** uint256(decimals);
        require(balanceOf[owner] >= amount, "Insufficient balance");
        
        balanceOf[owner] -= amount;
        totalSupply -= amount;
        
        emit Burn(owner, amount);
        emit Transfer(owner, address(0), amount);
        return true;
    }
}
